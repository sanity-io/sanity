import {useActorRef, useSelector} from '@xstate/react'
import {
  type ChangeEvent,
  type ComponentType,
  type RefAttributes,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  combineLatest,
  debounceTime,
  filter,
  firstValueFrom,
  map,
  type Observable,
  startWith,
  Subject,
  timeout,
} from 'rxjs'
import {type ActorRefFromLogic, fromObservable, fromPromise} from 'xstate'

import {STUDIO_DSN} from '../../error/sentry/sentryErrorReporter'
import {StudioFeedbackDialog} from '../../feedback/components/StudioFeedbackDialog'
import {useFeedbackTelemetry} from '../../feedback/hooks/useFeedbackTelemetry'
import {useClient} from '../../hooks/useClient'
import {useSchema} from '../../hooks/useSchema'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {studioLocaleNamespace} from '../../i18n/localeNamespaces'
import {usePerspective} from '../../perspective/usePerspective'
import {useSetVariant} from '../../perspective/useSetVariant'
import {VersionContextMenuDialogs} from '../../releases/components/documentHeader/contextMenu/VersionContextMenuDialogs'
import {VersionContextMenuPopover} from '../../releases/components/documentHeader/contextMenu/VersionContextMenuPopover'
import {useDocumentVersionsObservable} from '../../releases/hooks/useDocumentVersions'
import {useVersionContextMenu} from '../../releases/hooks/useVersionContextMenu'
import {isReleaseDocument, type VersionInfoDocumentStub} from '../../releases/store/types'
import {useActiveReleases} from '../../releases/store/useActiveReleases'
import {useReleasesStore} from '../../releases/store/useReleasesStore'
import {getReleaseIdFromReleaseDocumentId} from '../../releases/util/getReleaseIdFromReleaseDocumentId'
import {useReleasesToolAvailable} from '../../schedules/hooks/useReleasesToolAvailable'
import {useAgentBundlesStore} from '../../store/agent/useAgentBundles'
import {useDocumentPresence} from '../../store/presence/useDocumentPresence'
import {useWorkspace} from '../../studio/workspace'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'
import {getPublishedId, type SystemBundle} from '../../util/draftUtils'
import {getDocumentVersionVariantId} from '../../util/getDocumentVersionVariant'
import {isPausedCardinalityOneRelease} from '../../util/releaseUtils'
import {useVariantDocumentOperations} from '../../variants/hooks/useVariantDocumentOperations'
import {useVariantsStore} from '../../variants/store/useVariantsStore'
import {deletionMachine, type ReferringDocuments} from '../machines/deletionMachine'
import {documentGroupInventoryMachine} from '../machines/documentGroupInventoryMachine'
import {selectionMachine, type Variant} from '../machines/selectionMachine'
import {
  type VariantCreationBundle,
  variantCreationMachine,
} from '../machines/variantCreationMachine'
import {
  type DocumentGroupInventoryComponents,
  type DocumentGroupInventoryPerspectiveList,
} from '../types'
import {
  getVersionPresence,
  groupPresenceByVersion,
  type VersionPresence,
} from '../utils/groupPresenceByVersion'
import {resolveServedVersion, type ServedStatus} from '../utils/resolveServedVersion'
import {
  getBlockedSelectedIds,
  getRowToggle,
  getSetSelection,
  type RangeAnchor,
  SELECTION_BLOCKED_GROUP_KEYS,
  SELECTION_BLOCKED_REASON_KEYS,
  type SelectionBlockedReason,
} from '../utils/selection'
import {
  type DisplayedVariantSet,
  type PendingDraft,
  withPendingDraft,
} from '../utils/withPendingDraft'
import {Body} from './Body'
import {ConfirmDeleteDialog} from './ConfirmDeleteDialog'
import {Container} from './Container'
import {CreateVariant} from './CreateVariant/CreateVariant'
import {getNearestBaseVersion} from './CreateVariant/getNearestBaseVersion'
import {DocumentGroupEntry, resolveVariantRelease} from './DocumentGroupEntry'
import {DocumentGroupSet} from './DocumentGroupSet'
import {InventoryHeader} from './InventoryHeader'
import {PendingDraftEntry} from './PendingDraftEntry'
import {ScheduleDraftAction} from './ScheduleDraftAction'
import {UnscheduleReleaseAction} from './UnscheduleReleaseAction'
import {useVariantPendingReleases} from './useVariantPendingReleases'
import {VariantCheckbox} from './VariantSet/VariantCheckbox'

interface DocumentGroupInventoryBaseProps {
  documentId: string
  documentType: string
  /**
   * The id of the document version to mark as currently viewed. Defaults to
   * {@link DocumentGroupInventoryBaseProps.documentId}. `null` marks no version, for when the
   * viewed version is not known yet.
   */
  selectedId?: string | null
  /**
   * A draft the form is about to create: in Drafts, the open audience has no draft yet and the
   * first edit creates it. Drawn as a ghost row in the Draft set, marked open. Pass its id as
   * `selectedId` too.
   */
  pendingDraft?: PendingDraft
  /**
   * Called when a version's primary action fires. What "picking" a version
   * means is the consumer's decision: switching the studio's perspective,
   * navigating elsewhere, and so on.
   */
  onSelect: (document: VersionInfoDocumentStub) => void
}

/**
 * Props for the full inventory: the document group's versions plus the actions that mutate
 * them (selection, deletion, variant creation, and the version context menu).
 *
 * @internal
 */
export interface DocumentGroupInventoryManageProps extends DocumentGroupInventoryBaseProps {
  mode: 'manage'
  /**
   * The name of the portal element used to render popovers and dialogs (e.g.
   * the document panel portal provided by the structure tool).
   */
  portalElementName: string
  /**
   * Derived perspective list state for the inventory document.
   */
  perspectiveList: DocumentGroupInventoryPerspectiveList
  /**
   * Observable describing the documents that refer to the inventory document.
   */
  referringDocuments$: Observable<ReferringDocuments>
  /**
   * Pane-coupled presentational components injected by the consumer.
   */
  components: DocumentGroupInventoryComponents
}

/**
 * Props for the selection-only inventory. It renders the same named sets of document versions
 * (variants, releases, draft/published, anonymous bundles), but every mutative action is refused
 * by the machines, so none of the manage-mode wiring is required.
 *
 * @internal
 */
export interface DocumentGroupInventoryReadOnlyProps extends DocumentGroupInventoryBaseProps {
  mode: 'readOnly'
}

/**
 * @internal
 */
export type DocumentGroupInventoryProps =
  | DocumentGroupInventoryManageProps
  | DocumentGroupInventoryReadOnlyProps

/**
 * @internal
 */
export interface DocumentGroupInventoryHandle {
  inventory: ActorRefFromLogic<typeof documentGroupInventoryMachine>
}

/**
 * @internal
 */
export function DocumentGroupInventory(
  props: DocumentGroupInventoryProps & RefAttributes<DocumentGroupInventoryHandle | null>,
) {
  const {ref, documentId, documentType, selectedId = documentId, onSelect, pendingDraft} = props
  const readOnly = props.mode === 'readOnly'

  // Read the manage-only props into locals
  const portalElementName = props.mode === 'readOnly' ? undefined : props.portalElementName
  const perspectiveList = props.mode === 'readOnly' ? undefined : props.perspectiveList
  const referringDocuments$ = props.mode === 'readOnly' ? undefined : props.referringDocuments$
  const components = props.mode === 'readOnly' ? undefined : props.components

  const {beta} = useWorkspace()
  const variantsEnabled = beta?.variants?.enabled
  const {t} = useTranslation(studioLocaleNamespace)
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const schema = useSchema().get(documentType)
  const versionState = useDocumentVersionsObservable({documentId})
  const {state$: releases} = useReleasesStore()
  const {state$: agentBundles} = useAgentBundlesStore()
  const {state$: variants} = useVariantsStore()

  const filterStringEvent = useMemo(() => new Subject<ChangeEvent<HTMLInputElement>>(), [])
  const {feedbackDialogOpened} = useFeedbackTelemetry()
  const setVariant = useSetVariant()
  const {createVariantDocument} = useVariantDocumentOperations()

  const filterString = useMemo(
    () =>
      filterStringEvent.pipe(
        map((event) => event.target.value),
        debounceTime(150),
        map((value) => value.trim()),
        map((value) => (value.length > 1 ? value : undefined)),
        startWith(undefined),
      ),
    [filterStringEvent],
  )

  const inventoryMachine = useMemo(
    () =>
      documentGroupInventoryMachine.provide({
        actors: {
          meta: fromObservable(() =>
            combineLatest({versionState, releases, variants, agentBundles}),
          ),
        },
        actions: {
          onFeedbackBegin: feedbackDialogOpened,
        },
      }),
    [versionState, releases, variants, agentBundles, feedbackDialogOpened],
  )

  const inventoryRef = useActorRef(inventoryMachine, {
    input: {
      t,
      variantsEnabled,
      readOnly,
      selectionMachine: useMemo(
        () =>
          selectionMachine.provide({
            actors: {
              filterString: fromObservable(() => filterString),
            },
          }),
        [filterString],
      ),
      // Read-only mode passes the machines unprovided: their actors are
      // unreachable, because the guards refuse every event that would invoke
      // them, so there is nothing for the caller to wire up.
      deletionMachine: useMemo(
        () =>
          typeof referringDocuments$ === 'undefined'
            ? deletionMachine
            : deletionMachine.provide({
                actors: {
                  referringDocuments: fromObservable(() => referringDocuments$),
                  deleteVariants: fromPromise(({input, signal}) => {
                    return input.ids
                      .reduce(
                        (pendingTransaction, id) => pendingTransaction.delete(id),
                        client.transaction(),
                      )
                      .commit({
                        tag: 'document.delete',
                        skipCrossDatasetReferenceValidation: true,
                        signal,
                      })
                  }),
                },
              }),
        [referringDocuments$, client],
      ),
      variantCreationMachine: useMemo(
        () =>
          readOnly
            ? variantCreationMachine
            : variantCreationMachine.provide({
                actors: {
                  variants: fromObservable(() => variants),
                  releases: fromObservable(() => releases),
                  createVariant: fromPromise(async ({input, signal}) => {
                    const baseBundle: VariantCreationBundle =
                      typeof input.bundle === 'string'
                        ? {type: 'drafts'}
                        : {type: 'release', releaseId: input.bundle._id}

                    // Live-edit documents have no drafts sibling: create the variant-of-published
                    // even when the selected bundle is drafts. Release bundles still target the release.
                    const createPerspective =
                      schema?.liveEdit && input.bundle === ('drafts' satisfies SystemBundle)
                        ? 'published'
                        : input.bundle

                    const perspective =
                      typeof input.bundle === 'string'
                        ? input.bundle
                        : getReleaseIdFromReleaseDocumentId(input.bundle._id)

                    const readVersions = async () => {
                      const versionSnapshot = await firstValueFrom(
                        versionState.pipe(
                          filter(({loading}) => !loading),
                          timeout({first: 30_000}),
                        ),
                      )

                      if (versionSnapshot.error) {
                        throw versionSnapshot.error instanceof Error
                          ? versionSnapshot.error
                          : new Error('Failed to load document versions')
                      }
                      return versionSnapshot.versions
                    }

                    const variantDefinition = input.variantDefinition

                    // Without a picked version, the variant starts from the version nearest to
                    // the selected variant and bundle.
                    const baseDocument =
                      typeof input.baseId === 'string'
                        ? {_id: input.baseId}
                        : getNearestBaseVersion({
                            variantId: variantDefinition._id,
                            bundle: baseBundle,
                            versions: await readVersions(),
                          })

                    if (typeof baseDocument === 'undefined') {
                      // There is no version to start from, so the variant starts empty.
                      await createVariantDocument({
                        documentGroupId: getPublishedId(documentId),
                        document: {
                          _type: documentType,
                        },
                        variant: variantDefinition,
                        selectedPerspective: createPerspective,
                        signal,
                      })
                    } else {
                      await createVariantDocument({
                        documentGroupId: getPublishedId(documentId),
                        baseId: baseDocument._id,
                        variant: variantDefinition,
                        selectedPerspective: createPerspective,
                        signal,
                      })
                    }

                    // TODO: Would this be better encapsulated as a machine effect?
                    setVariant({
                      variantId: variantDefinition._id,
                      perspective,
                    })
                  }),
                },
              }),
        [
          readOnly,
          variants,
          releases,
          createVariantDocument,
          setVariant,
          documentType,
          documentId,
          schema,
          versionState,
        ],
      ),
    },
  })

  const selectionRef = useSelector(inventoryRef, ({context}) => context.selectionRef)
  const deletionRef = useSelector(inventoryRef, ({context}) => context.deletionRef)
  const variantCreationRef = useSelector(inventoryRef, ({context}) => context.variantCreationRef)

  useImperativeHandle(ref, () => ({inventory: inventoryRef}), [inventoryRef])

  const isDeletionActive = useSelector(deletionRef, (snapshot) => snapshot.matches('active'))
  const isFeedbackActive = useSelector(inventoryRef, (snapshot) => snapshot.matches('feedback'))

  const isVariantCreationActive = useSelector(inventoryRef, (snapshot) =>
    snapshot.matches('creatingVariant'),
  )

  const isVariantCreationPending = useSelector(variantCreationRef, (snapshot) =>
    snapshot.matches({active: 'creating'}),
  )

  const titleDocument = useMemo(
    () => ({_id: documentId, _type: documentType}),
    [documentId, documentType],
  )

  const sets = useSelector(inventoryRef, ({context}) => context.sets)

  return (
    <>
      <Container data-testid={readOnly ? 'document-group-picker' : 'document-group-inventory'}>
        {isVariantCreationActive || isVariantCreationPending ? (
          <CreateVariant
            variantCreationRef={variantCreationRef}
            sets={sets}
            documentTitle={components && <components.DocTitle document={titleDocument} />}
          />
        ) : (
          !readOnly && (
            <InventoryHeader
              selectionRef={selectionRef}
              deletionRef={deletionRef}
              variantCreationRef={variantCreationRef}
              components={components}
            />
          )
        )}
        <Body>
          {schema && (
            <Select
              // Groups collapse per document, for the session. Keyed by the document group, not the
              // open version: the first edit turns the open version from a published one into a
              // new draft, and a key on the version would rebuild the whole list at that moment.
              key={getPublishedId(documentId)}
              documentId={documentId}
              machine={selectionRef}
              inventoryRef={inventoryRef}
              selectedId={selectedId}
              pendingDraft={pendingDraft}
              documentType={documentType}
              readOnly={readOnly}
              perspectiveList={perspectiveList}
              onSelect={onSelect}
            />
          )}
        </Body>
      </Container>
      {isDeletionActive &&
        typeof portalElementName !== 'undefined' &&
        typeof components !== 'undefined' && (
          <ConfirmDeleteDialog
            documentId={documentId}
            documentType={documentType}
            deletionRef={deletionRef}
            selectionRef={selectionRef}
            portalElementName={portalElementName}
            components={components}
          />
        )}
      {isFeedbackActive && (
        <StudioFeedbackDialog
          dsn={STUDIO_DSN}
          feedbackVersion="1"
          source="document-group-inventory"
          onClose={() => inventoryRef.send({type: 'feedback.end'})}
          sentimentLabel={t('content-variants.feedback.sentiment-label')}
          title={t('content-variants.feedback.title')}
        />
      )}
    </>
  )
}

const Select: ComponentType<{
  /** Any id in the document group. Presence is read for every version of the group. */
  documentId: string
  machine: ActorRefFromLogic<typeof selectionMachine>
  inventoryRef: ActorRefFromLogic<typeof documentGroupInventoryMachine>
  selectedId: string | null
  pendingDraft: PendingDraft | undefined
  documentType: string
  onSelect: (document: VersionInfoDocumentStub) => void
  readOnly: boolean
  /** Absent in read-only mode, where the version context menu is not rendered. */
  perspectiveList: DocumentGroupInventoryPerspectiveList | undefined
}> = ({
  documentId,
  machine,
  inventoryRef,
  selectedId,
  pendingDraft,
  documentType,
  onSelect,
  readOnly,
  perspectiveList,
}) => {
  const {t} = useTranslation(studioLocaleNamespace)
  const versionSets = useSelector(inventoryRef, ({context}) => context.sets)
  // The first edit creates the draft, and the pane can learn that before the version list has it,
  // with a moment in between where it marks no version open while it resolves the new draft. The
  // ghost row stays through both, until the real row takes its place (`withPendingDraft` then
  // leaves the sets alone) or another version is opened, so the row changes in place rather than
  // going and coming back.
  const [heldDraft, setHeldDraft] = useState(pendingDraft)
  if (pendingDraft && pendingDraft.id !== heldDraft?.id) {
    setHeldDraft(pendingDraft)
  }
  // Whether the held draft was the open version when the open version was last known
  const [heldOpen, setHeldOpen] = useState(true)
  const nextHeldOpen =
    Boolean(pendingDraft) || selectedId === null
      ? heldOpen || Boolean(pendingDraft)
      : selectedId === heldDraft?.id
  if (nextHeldOpen !== heldOpen) setHeldOpen(nextHeldOpen)
  const shownDraft =
    pendingDraft ??
    // While the pane resolves the new draft it marks no version open (`null`); that holds the
    // ghost row only while it was the open version, not after another version was opened
    (heldDraft && (selectedId === heldDraft.id || (selectedId === null && heldOpen))
      ? heldDraft
      : undefined)
  // The draft the form is about to create joins the Draft set as a ghost row
  const sets = useMemo(
    () => withPendingDraft(versionSets, shownDraft, t('release.chip.draft')),
    [versionSets, shownDraft, t],
  )
  // Everyone in any version of the group, grouped by the exact version each person has open
  const documentPresence = useDocumentPresence(documentId)
  const presenceByVersion = useMemo(
    () => groupPresenceByVersion(documentPresence),
    [documentPresence],
  )
  const variantsEnabled = useSelector(inventoryRef, ({context}) => context.variantsEnabled)
  const perspective = usePerspective()

  const documentVersions = sets.flatMap((set) => set.variants.map(({document}) => document))

  const servedVersion = readOnly
    ? undefined
    : resolveServedVersion({
        perspective,
        variantsEnabled: variantsEnabled ?? false,
        versions: documentVersions,
      })

  const selectedIds = useSelector(machine, ({context}) => context.selectedIds)
  const isLocked = useSelector(machine, (snapshot) => snapshot.matches('locked'))

  const hasFilterString = useSelector(
    machine,
    ({context}) => typeof context.filterString !== 'undefined',
  )

  const filterMatchingVariantIds = useSelector(
    machine,
    ({context}) => context.filterMatchingVariantIds,
  )

  const releases = useSelector(inventoryRef, ({context}) => context.releases)

  const rangeAnchorRef = useRef<RangeAnchor>(null)

  // A selected version can become blocked, as when its release is scheduled. Its checkbox then
  // shows unchecked, so it leaves the selection too, rather than staying in the count and the
  // deletion out of sight.
  const blockedSelectedIds = getBlockedSelectedIds({
    variants: sets.flatMap(({variants}) => variants),
    selectedIds,
    getRelease: (variant) => resolveVariantRelease(variant, releases),
  })
  const blockedSelectedKey = blockedSelectedIds.join(',')
  // The machine ignores changes while a deletion holds the selection, so this retries on unlock.
  useEffect(() => {
    if (blockedSelectedKey === '' || isLocked) return
    machine.send({type: 'selection.removeMany', variantIds: blockedSelectedKey.split(',')})
  }, [blockedSelectedKey, isLocked, machine])

  return (
    <>
      {sets.map((set) => {
        const visibleVariants = set.variants.filter(
          ({id}) => !hasFilterString || filterMatchingVariantIds.has(id),
        )
        const getRelease = (variant: (typeof set.variants)[number]) =>
          resolveVariantRelease(variant, releases)
        const shownSelection = getSetSelection({variants: visibleVariants, selectedIds, getRelease})
        // Whether the whole group is locked is the set's, not the filter's: a filter that hides
        // every row of a scheduled set leaves its lock and its unschedule action in place
        const setSelection = {
          ...shownSelection,
          groupBlockedReason: getSetSelection({variants: set.variants, selectedIds, getRelease})
            .groupBlockedReason,
        }

        const toggleVariant = (variantId: string, shiftKey: boolean) => {
          const toggle = getRowToggle({
            setKey: set.key,
            selectableIds: setSelection.selectableIds,
            selectedIds,
            anchor: rangeAnchorRef.current,
            variantId,
            shiftKey,
          })
          machine.send(toggle.event)
          rangeAnchorRef.current = toggle.anchor
        }

        return (
          <DocumentGroupSet
            key={set.key}
            name={set.name}
            // The single set shown while Content Variants is off has no bundle, and its name
            // already carries the count. A ghost row is not counted, and a set that holds only a
            // ghost row shows no count and has nothing to select.
            count={set.bundle && set.variants.length > 0 ? set.variants.length : undefined}
            bundle={set.bundle}
            readOnly={readOnly}
            nothingToSelect={set.variants.length === 0}
            locked={isLocked}
            containsOpen={Boolean(set.pending) || set.variants.some(({id}) => id === selectedId)}
            selectionState={setSelection.state}
            // A scheduled release's or scheduled draft's set: a lock in place of the checkbox, the
            // reason on hover, and a way to unschedule (or pause) it, rather than a second line
            // under the name
            blockedReason={
              setSelection.groupBlockedReason
                ? t(SELECTION_BLOCKED_GROUP_KEYS[setSelection.groupBlockedReason])
                : undefined
            }
            headerActions={
              // Scheduled: a way to unschedule (pause). A paused scheduled draft: a way to
              // schedule it again, so both directions happen where the lock shows
              !readOnly &&
              set.bundle?.type === 'perspective' &&
              isReleaseDocument(set.bundle.perspective) ? (
                setSelection.groupBlockedReason !== undefined ? (
                  <UnscheduleReleaseAction release={set.bundle.perspective} />
                ) : isPausedCardinalityOneRelease(set.bundle.perspective) && set.variants[0] ? (
                  <ScheduleDraftAction
                    documentType={documentType}
                    release={set.bundle.perspective}
                    versionId={set.variants[0].id}
                  />
                ) : undefined
              ) : undefined
            }
            onCheckedChange={(checked) =>
              machine.send(
                checked
                  ? {type: 'selection.addMany', variantIds: setSelection.selectableIds}
                  : // Clearing the group clears it whole, rows hidden by the filter included, so
                    // nothing it held stays selected out of sight.
                    {type: 'selection.removeMany', variantIds: set.variants.map(({id}) => id)},
              )
            }
          >
            {withPendingRow(
              visibleVariants,
              // Hidden while the list is filtered: it is not a version the filter can match
              hasFilterString ? undefined : set.pending,
            ).map((variant) =>
              'pendingDraft' in variant ? (
                <PendingDraftEntry
                  key={variant.pendingDraft.id}
                  draft={variant.pendingDraft}
                  selectable={!readOnly}
                />
              ) : // The version context menu is a hook, so the two rows have to be
              // separate components rather than one row that skips the actions.
              readOnly ? (
                <ReadOnlyVariantRow
                  key={variant.id}
                  variant={variant}
                  presence={getVersionPresence(presenceByVersion, variant.id)}
                  documentVersions={documentVersions}
                  inventoryRef={inventoryRef}
                  onSelect={onSelect}
                  isSelected={selectedId === variant.id}
                />
              ) : (
                <ManagedVariantRow
                  key={variant.id}
                  variant={variant}
                  presence={getVersionPresence(presenceByVersion, variant.id)}
                  documentVersions={documentVersions}
                  machine={machine}
                  inventoryRef={inventoryRef}
                  documentType={documentType}
                  onSelect={onSelect}
                  isSelected={selectedId === variant.id}
                  servedStatus={servedVersion?.id === variant.id ? servedVersion.status : undefined}
                  perspectiveList={perspectiveList}
                  selectionBlockedReason={setSelection.blockedReasons.get(variant.id)}
                  onToggleSelection={(shiftKey) => toggleVariant(variant.id, shiftKey)}
                />
              ),
            )}
          </DocumentGroupSet>
        )
      })}
    </>
  )
}

/**
 * Whether a version row opens the version context menu on right-click. Off for the open beta: the
 * menu was cut off at the panel's edge and duplicated actions found elsewhere, so it returns once
 * it is designed for the inventory.
 */
const INVENTORY_ROW_CONTEXT_MENU = false

/** The rows of a set in order, with a pending draft's ghost row at its place. */
function withPendingRow(
  variants: Variant[],
  pending: DisplayedVariantSet['pending'],
): Array<Variant | {pendingDraft: PendingDraft}> {
  if (!pending) return variants
  const index = Math.min(pending.index, variants.length)
  return [...variants.slice(0, index), {pendingDraft: pending.draft}, ...variants.slice(index)]
}

/**
 * A version row with no actions attached: the primary action reports the pick
 * to the consumer and nothing else is offered.
 */
const ReadOnlyVariantRow: ComponentType<{
  variant: Variant
  presence: VersionPresence
  documentVersions: VersionInfoDocumentStub[]
  inventoryRef: ActorRefFromLogic<typeof documentGroupInventoryMachine>
  onSelect: (document: VersionInfoDocumentStub) => void
  isSelected: boolean
}> = ({variant, presence, documentVersions, inventoryRef, onSelect, isSelected}) => {
  const releases = useSelector(inventoryRef, ({context}) => context.releases)

  return (
    <DocumentGroupEntry
      variant={variant}
      releases={releases}
      documentVersions={documentVersions}
      isSelected={isSelected}
      presence={presence}
      onPrimaryAction={() => onSelect(variant.document)}
    />
  )
}

const ManagedVariantRow: ComponentType<{
  variant: Variant
  presence: VersionPresence
  documentVersions: VersionInfoDocumentStub[]
  machine: ActorRefFromLogic<typeof selectionMachine>
  inventoryRef: ActorRefFromLogic<typeof documentGroupInventoryMachine>
  documentType: string
  onSelect: (document: VersionInfoDocumentStub) => void
  isSelected: boolean
  servedStatus: ServedStatus | undefined
  /**
   * Always supplied by manage mode, where this row is rendered. Optional only
   * so the caller can pick the row by mode rather than by prop presence.
   */
  perspectiveList: DocumentGroupInventoryPerspectiveList | undefined
  /** Why this version cannot be selected for deletion, if it cannot. */
  selectionBlockedReason: SelectionBlockedReason | undefined
  /** Toggles this version's selection; with Shift, selects a range within its group. */
  onToggleSelection: (shiftKey: boolean) => void
}> = ({
  variant,
  presence,
  documentVersions,
  machine,
  inventoryRef,
  documentType,
  onSelect,
  isSelected,
  servedStatus,
  perspectiveList,
  selectionBlockedReason,
  onToggleSelection,
}) => {
  const {t} = useTranslation(studioLocaleNamespace)
  const releasesToolAvailable = useReleasesToolAvailable()
  const {loading: releasesLoading} = useActiveReleases()
  // Derived from `_system` rather than the id, because `_system` is authoritative: it
  // distinguishes a variant-scoped draft (`versions.<scope>.<id>` with `bundleId: 'drafts'`)
  // from a release version, which the id alone cannot.
  const {document} = variant
  const versionId = document._id
  const documentGroupId = document._system.group._ref
  const isPublishedVersion = !document._system.bundleId
  const isDraftVersion = document._system.bundleId === 'drafts'
  const bundleId = isPublishedVersion
    ? 'published'
    : isDraftVersion
      ? 'draft'
      : (document._system.bundleId ?? '')

  const isLocked = useSelector(machine, (snapshot) => snapshot.matches('locked'))
  const selectedIds = useSelector(machine, ({context}) => context.selectedIds)
  const releases = useSelector(inventoryRef, ({context}) => context.releases)

  const clearScheduledDraftPerspective = perspectiveList?.clearScheduledDraftPerspective

  const release = resolveVariantRelease(variant, releases)

  const pendingReleases = useVariantPendingReleases({
    documentId: documentGroupId,
    variantId: getDocumentVersionVariantId(document),
  })

  const {
    contextMenu,
    handleContextMenu,
    popoverRef,
    referenceElement,
    setReferenceElement,
    dialogState,
    closeDialog,
    openDiscardDialog,
    openCreateReleaseDialog,
    handleCopyToDrafts,
    handleAddVersion,
    isScheduledDraft,
    scheduledDraftMenuActions,
    sourceReleasePerspective,
  } = useVersionContextMenu({
    documentGroupId,
    documentVersionInfoStub: document,
    documentType,
    disabled: isLocked,
    onCopyToDraftsComplete: clearScheduledDraftPerspective,
  })

  const contextMenuHandler =
    INVENTORY_ROW_CONTEXT_MENU && !isLocked && releasesToolAvailable ? handleContextMenu : undefined

  return (
    <>
      <DocumentGroupEntry
        variant={variant}
        releases={releases}
        documentVersions={documentVersions}
        isSelected={isSelected}
        presence={presence}
        servedStatus={servedStatus}
        primaryActionRef={setReferenceElement}
        onContextMenu={contextMenuHandler}
        onPrimaryAction={() => onSelect(document)}
        onToggleSelection={
          isLocked || selectionBlockedReason ? undefined : () => onToggleSelection(false)
        }
        selectionBlockedReason={
          selectionBlockedReason
            ? t(SELECTION_BLOCKED_REASON_KEYS[selectionBlockedReason])
            : undefined
        }
        leading={
          <VariantCheckbox
            label={t('document-group.select-version', {name: variant.name})}
            tabbable={false}
            checked={selectedIds.has(variant.id)}
            locked={isLocked}
            blockedReason={
              selectionBlockedReason
                ? t(SELECTION_BLOCKED_REASON_KEYS[selectionBlockedReason])
                : undefined
            }
            onChange={(_checked, {shiftKey}) => onToggleSelection(shiftKey)}
          />
        }
      />
      <VersionContextMenuPopover
        contextMenu={contextMenu}
        popoverRef={popoverRef}
        referenceElement={referenceElement}
        documentGroupId={documentGroupId}
        documentType={documentType}
        bundleId={bundleId}
        releases={pendingReleases}
        releasesLoading={releasesLoading}
        versionId={versionId}
        onDiscard={openDiscardDialog}
        onCreateRelease={openCreateReleaseDialog}
        onCopyToDrafts={handleCopyToDrafts}
        onCreateVersion={handleAddVersion}
        disabled={isLocked}
        release={release}
        isScheduledDraft={isScheduledDraft}
        scheduledDraftMenuActions={scheduledDraftMenuActions}
        isDiscardable={false}
      />
      <VersionContextMenuDialogs
        dialogState={dialogState}
        onClose={closeDialog}
        versionId={versionId}
        documentType={documentType}
        title={variant.name}
        sourceReleasePerspective={sourceReleasePerspective}
        onCreateVersion={handleAddVersion}
        onCopyToDrafts={handleCopyToDrafts}
        scheduledDraftDialogs={isScheduledDraft && scheduledDraftMenuActions.dialogs}
      />
    </>
  )
}
