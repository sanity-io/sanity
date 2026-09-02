import CloseIcon from '@sanity/icons/Close'
import {FeedbackIcon} from '@sanity/icons/Feedback'
import {TrashIcon} from '@sanity/icons/Trash'
import {PortalProvider, Stack, Text} from '@sanity/ui'
import {useActorRef, useSelector} from '@xstate/react'
import {
  type ChangeEvent,
  type ComponentType,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react'
import {useSyncObservable} from 'react-rx'
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
import {Flex} from 'ui5'
import {type ActorRefFromLogic, fromObservable, fromPromise} from 'xstate'

import {Button} from '../../../ui-components/button/Button'
import {STUDIO_DSN} from '../../error/sentry/sentryErrorReporter'
import {StudioFeedbackDialog} from '../../feedback/components/StudioFeedbackDialog'
import {useFeedbackTelemetry} from '../../feedback/hooks/useFeedbackTelemetry'
import {useClient} from '../../hooks/useClient'
import {useSchema} from '../../hooks/useSchema'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {feedbackLocaleNamespace, studioLocaleNamespace} from '../../i18n/localeNamespaces'
import {useSetVariant} from '../../perspective/useSetVariant'
import {VersionContextMenuDialogs} from '../../releases/components/documentHeader/contextMenu/VersionContextMenuDialogs'
import {VersionContextMenuPopover} from '../../releases/components/documentHeader/contextMenu/VersionContextMenuPopover'
import {useDocumentVersionsObservable} from '../../releases/hooks/useDocumentVersions'
import {useVersionContextMenu} from '../../releases/hooks/useVersionContextMenu'
import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {useActiveReleases} from '../../releases/store/useActiveReleases'
import {useReleasesStore} from '../../releases/store/useReleasesStore'
import {getReleaseIdFromReleaseDocumentId} from '../../releases/util/getReleaseIdFromReleaseDocumentId'
import {useReleasesToolAvailable} from '../../schedules/hooks/useReleasesToolAvailable'
import {useAgentBundlesStore} from '../../store/agent/useAgentBundles'
import {useDocumentStore} from '../../store/datastores'
import {useWorkspace} from '../../studio/workspace'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'
import {getPublishedId, type SystemBundle} from '../../util/draftUtils'
import {useVariantDocumentOperations} from '../../variants/hooks/useVariantDocumentOperations'
import {CreateVariantIcon} from '../../variants/plugin/components/PersonalizationIcons'
import {useVariantsStore} from '../../variants/store/useVariantsStore'
import {deletionMachine, type ReferringDocuments} from '../machines/deletionMachine'
import {documentGroupInventoryMachine} from '../machines/documentGroupInventoryMachine'
import {selectionMachine, type Variant} from '../machines/selectionMachine'
import {variantCreationMachine} from '../machines/variantCreationMachine'
import {
  type DocumentGroupInventoryComponents,
  type DocumentGroupInventoryPerspectiveList,
} from '../types'
import {Body} from './Body'
import {ConfirmDeleteDialog} from './ConfirmDeleteDialog'
import {Container} from './Container'
import {CreateVariant} from './CreateVariant/CreateVariant'
import {DocumentGroupEntry, resolveVariantRelease} from './DocumentGroupEntry'
import {DocumentGroupFilter} from './DocumentGroupFilter'
import {DocumentGroupSet} from './DocumentGroupSet'
import {Footer} from './Footer'
import {Header} from './Header'
import {TextButton} from './TextButton'
import {useVariantPendingReleases} from './useVariantPendingReleases'
import {VariantCheckbox} from './VariantSet/VariantCheckbox'

interface DocumentGroupInventoryBaseProps {
  documentId: string
  documentType: string
  /**
   * The id of the document version to mark as currently viewed. Defaults to
   * {@link DocumentGroupInventoryBaseProps.documentId}.
   */
  selectedId?: string
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
   * Request the parent to close the document group inventory.
   */
  requestClose?: () => void
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
export const DocumentGroupInventory: ComponentType<DocumentGroupInventoryProps> = (props) => {
  const {documentId, documentType, selectedId = documentId, onSelect} = props
  const readOnly = props.mode === 'readOnly'

  // Read the manage-only props into locals
  const portalElementName = props.mode === 'readOnly' ? undefined : props.portalElementName
  const perspectiveList = props.mode === 'readOnly' ? undefined : props.perspectiveList
  const referringDocuments$ = props.mode === 'readOnly' ? undefined : props.referringDocuments$
  const requestClose = props.mode === 'readOnly' ? undefined : props.requestClose
  const components = props.mode === 'readOnly' ? undefined : props.components

  const {beta} = useWorkspace()
  const variantsEnabled = beta?.variants?.enabled
  const {t} = useTranslation(studioLocaleNamespace)
  const {t: feedbackT} = useTranslation(feedbackLocaleNamespace)
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const schema = useSchema().get(documentType)
  const versionState = useDocumentVersionsObservable({documentId})
  const {state$: releases} = useReleasesStore()
  const {state$: agentBundles} = useAgentBundlesStore()
  const {state$: variants} = useVariantsStore()
  const [containerElement, setContainerElement] = useState<HTMLDivElement | null>(null)
  const filterStringEvent = useMemo(() => new Subject<ChangeEvent<HTMLInputElement>>(), [])
  const [menuPortalElement, setMenuPortalElement] = useState<HTMLDivElement | null>(null)
  const {feedbackDialogOpened} = useFeedbackTelemetry()
  const setVariant = useSetVariant()
  const {createVariantDocument} = useVariantDocumentOperations()
  const documentStore = useDocumentStore()

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
                    const bundleId =
                      typeof input.bundle === 'string'
                        ? undefined
                        : getReleaseIdFromReleaseDocumentId(input.bundle._id)

                    const editStateSlot =
                      typeof input.bundle === 'string'
                        ? input.bundle === ('drafts' satisfies SystemBundle)
                          ? 'draft'
                          : 'published'
                        : 'version'

                    const readTargetPair = documentStore.pair
                      .editState(getPublishedId(documentId), documentType, bundleId)
                      .pipe(
                        filter(({ready}) => ready),
                        timeout({first: 30_000}),
                      )

                    // Live-edit documents have no drafts sibling: create the variant-of-published
                    // even when the selected bundle is drafts. Release bundles still target the release.
                    const createPerspective =
                      schema?.liveEdit && input.bundle === ('drafts' satisfies SystemBundle)
                        ? 'published'
                        : input.bundle

                    const targetPair = await firstValueFrom(readTargetPair)
                    const baseVariant =
                      editStateSlot === 'draft'
                        ? // in drafts fallback to published, the ui shows the published when seeing a "non existent" draft
                          targetPair[editStateSlot] || targetPair.published
                        : targetPair[editStateSlot]
                    // If there is no base variant, create an empty variant.
                    if (baseVariant === null) {
                      await createVariantDocument({
                        documentGroupId: getPublishedId(documentId),
                        document: {
                          _type: documentType,
                        },
                        variant: input.variantDefinition,
                        selectedPerspective: createPerspective,
                        signal,
                      })
                    }

                    // If there is a base variant, create a variant based on it.
                    if (baseVariant !== null) {
                      await createVariantDocument({
                        documentGroupId: getPublishedId(documentId),
                        baseId: baseVariant._id,
                        variant: input.variantDefinition,
                        selectedPerspective: createPerspective,
                        signal,
                      })
                    }

                    // TODO: Would this be better encapsulated as a machine effect?
                    setVariant({
                      variantId: input.variantDefinition._id,
                      perspective:
                        typeof input.bundle === 'string'
                          ? input.bundle
                          : getReleaseIdFromReleaseDocumentId(input.bundle._id),
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
          documentStore.pair,
          schema,
        ],
      ),
    },
  })

  const selectionRef = useSelector(inventoryRef, ({context}) => context.selectionRef)
  const deletionRef = useSelector(inventoryRef, ({context}) => context.deletionRef)
  const variantCreationRef = useSelector(inventoryRef, ({context}) => context.variantCreationRef)
  const metaState = useSelector(inventoryRef, ({context}) => context.metaState)

  const selectionCount = useSelector(selectionRef, ({context}) => context.selectedIds.size)
  const isLocked = useSelector(selectionRef, (snapshot) => snapshot.matches('locked'))
  const isDeletionActive = useSelector(deletionRef, (snapshot) => snapshot.matches('active'))
  const isFeedbackActive = useSelector(inventoryRef, (snapshot) => snapshot.matches('feedback'))

  const isVariantCreationActive = useSelector(inventoryRef, (snapshot) =>
    snapshot.matches('creatingVariant'),
  )

  const isVariantCreationPending = useSelector(variantCreationRef, (snapshot) =>
    snapshot.matches({active: 'creating'}),
  )

  const canRequestDeletion = useSelector(deletionRef, (machine) =>
    machine.can({type: 'delete.request'}),
  )

  const canCreateVariant = useSelector(variantCreationRef, (machine) =>
    machine.can({type: 'createVariant.request'}),
  )

  const [isActive, setIsActive] = useState<boolean>(false)

  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => setIsActive(metaState === 'ready'))
    return () => cancelAnimationFrame(frame)
  }, [metaState])

  usePreserveIntrinsicBlockSize({
    element: containerElement,
    isActive,
  })

  return (
    <>
      <Container
        ref={setContainerElement}
        data-testid={readOnly ? 'document-group-picker' : 'document-group-inventory'}
      >
        {(isVariantCreationActive || isVariantCreationPending) && (
          <CreateVariant variantCreationRef={variantCreationRef} selectionRef={selectionRef} />
        )}
        {!isVariantCreationActive && (
          <>
            <Header>
              <Stack gap={4}>
                {!readOnly && (
                  <Flex gap={4} alignItems="center" justifyContent="flex-end">
                    <TextButton
                      onClick={() => inventoryRef.send({type: 'feedback.begin'})}
                      title={feedbackT('feedback.menu-item')}
                      aria-label={feedbackT('feedback.menu-item')}
                    >
                      <Text size={1}>
                        <FeedbackIcon />
                      </Text>
                    </TextButton>
                    <TextButton
                      onClick={requestClose}
                      title={t('document-group-inventory.action.cancel')}
                      aria-label={t('document-group-inventory.action.cancel')}
                    >
                      <Text size={1}>
                        <CloseIcon />
                      </Text>
                    </TextButton>
                  </Flex>
                )}
                <DocumentGroupFilter
                  readOnly={isLocked}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => filterStringEvent.next(event)}
                />
              </Stack>
            </Header>
            <Body>
              {schema && (
                <Select
                  machine={selectionRef}
                  inventoryRef={inventoryRef}
                  selectedId={selectedId}
                  documentType={documentType}
                  readOnly={readOnly}
                  menuPortalElement={menuPortalElement}
                  perspectiveList={perspectiveList}
                  onSelect={onSelect}
                />
              )}
            </Body>
            {!readOnly && (
              <Footer>
                <Button
                  text={t('document-group-inventory.action.cancel')}
                  size="large"
                  mode="bleed"
                  onClick={requestClose}
                />
                {canCreateVariant && (
                  <Button
                    text={t('document-group.create-variant')}
                    tone="suggest"
                    size="large"
                    icon={CreateVariantIcon}
                    onClick={() => variantCreationRef.send({type: 'createVariant.request'})}
                  />
                )}
                {canRequestDeletion && (
                  <Button
                    text={t('document-group.delete.confirm-button.text', {count: selectionCount})}
                    onClick={() => deletionRef.send({type: 'delete.request'})}
                    tone="critical"
                    size="large"
                    icon={TrashIcon}
                  />
                )}
              </Footer>
            )}
          </>
        )}
      </Container>
      <div ref={setMenuPortalElement} />
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
          sentimentLabel={t('document-group-inventory.feedback.sentiment-label')}
        />
      )}
    </>
  )
}

const Select: ComponentType<{
  machine: ActorRefFromLogic<typeof selectionMachine>
  inventoryRef: ActorRefFromLogic<typeof documentGroupInventoryMachine>
  selectedId: string
  documentType: string
  onSelect: (document: VersionInfoDocumentStub) => void
  readOnly: boolean
  menuPortalElement: HTMLElement | null
  /** Absent in read-only mode, where the version context menu is not rendered. */
  perspectiveList: DocumentGroupInventoryPerspectiveList | undefined
}> = ({
  machine,
  inventoryRef,
  selectedId,
  documentType,
  onSelect,
  readOnly,
  menuPortalElement,
  perspectiveList,
}) => {
  const sets = useSelector(inventoryRef, ({context}) => context.sets)

  const hasFilterString = useSelector(
    machine,
    ({context}) => typeof context.filterString !== 'undefined',
  )

  const filterMatchingVariantIds = useSelector(
    machine,
    ({context}) => context.filterMatchingVariantIds,
  )

  // Selection is refused outright in read-only mode; while a deletion is in
  // flight the selection is only frozen, so the checkboxes stay rendered.
  const isSelectable = useSelector(machine, ({context}) => !context.readOnly)

  return (
    <Stack gap={5}>
      {sets.map((set) => (
        <DocumentGroupSet
          key={set.key}
          name={set.name}
          headerActions={
            isSelectable ? (
              <TextButton
                onClick={() => {
                  set.variants.forEach((variant) =>
                    machine.send({type: 'selection.add', variantId: variant.id}),
                  )
                }}
              >
                {/* These strings will be removed in the next iteration, so we've skipped internationalisation. */}
                <Text size={1}>{`Select all ${set.variants.length}`}</Text>
              </TextButton>
            ) : undefined
          }
        >
          {set.variants
            .filter(({id}) => !hasFilterString || filterMatchingVariantIds.has(id))
            // The version context menu is a hook, so the two rows have to be
            // separate components rather than one row that skips the actions.
            .map((variant) =>
              readOnly ? (
                <ReadOnlyVariantRow
                  key={variant.id}
                  variant={variant}
                  inventoryRef={inventoryRef}
                  onSelect={onSelect}
                  isSelected={selectedId === variant.id}
                />
              ) : (
                <ManagedVariantRow
                  key={variant.id}
                  variant={variant}
                  machine={machine}
                  inventoryRef={inventoryRef}
                  documentType={documentType}
                  onSelect={onSelect}
                  isSelected={selectedId === variant.id}
                  menuPortalElement={menuPortalElement}
                  perspectiveList={perspectiveList}
                />
              ),
            )}
        </DocumentGroupSet>
      ))}
    </Stack>
  )
}

/**
 * A version row with no actions attached: the primary action reports the pick
 * to the consumer and nothing else is offered.
 */
const ReadOnlyVariantRow: ComponentType<{
  variant: Variant
  inventoryRef: ActorRefFromLogic<typeof documentGroupInventoryMachine>
  onSelect: (document: VersionInfoDocumentStub) => void
  isSelected: boolean
}> = ({variant, inventoryRef, onSelect, isSelected}) => {
  const releases = useSelector(inventoryRef, ({context}) => context.releases)

  return (
    <DocumentGroupEntry
      variant={variant}
      releases={releases}
      isSelected={isSelected}
      onPrimaryAction={() => onSelect(variant.document)}
    />
  )
}

const ManagedVariantRow: ComponentType<{
  variant: Variant
  machine: ActorRefFromLogic<typeof selectionMachine>
  inventoryRef: ActorRefFromLogic<typeof documentGroupInventoryMachine>
  documentType: string
  onSelect: (document: VersionInfoDocumentStub) => void
  isSelected: boolean
  menuPortalElement: HTMLElement | null
  /**
   * Always supplied by manage mode, where this row is rendered. Optional only
   * so the caller can pick the row by mode rather than by prop presence.
   */
  perspectiveList: DocumentGroupInventoryPerspectiveList | undefined
}> = ({
  variant,
  machine,
  inventoryRef,
  documentType,
  onSelect,
  isSelected,
  menuPortalElement,
  perspectiveList,
}) => {
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
    variantRef: document._system.variant?._ref,
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

  const contextMenuHandler = isLocked || !releasesToolAvailable ? undefined : handleContextMenu

  return (
    <>
      <DocumentGroupEntry
        variant={variant}
        releases={releases}
        isSelected={isSelected}
        primaryActionRef={setReferenceElement}
        onContextMenu={contextMenuHandler}
        onPrimaryAction={() => onSelect(document)}
        leading={
          <VariantCheckbox
            checked={selectedIds.has(variant.id)}
            readOnly={isLocked}
            onChange={() => {
              machine.send({
                type: 'selection.toggle',
                variantId: variant.id,
              })
            }}
          />
        }
      />
      <PortalProvider element={menuPortalElement}>
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
          portal={Boolean(menuPortalElement)}
          isDiscardable={false}
        />
      </PortalProvider>
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

/**
 * Preserve the intrinsic block size of an element by maintaining an `--intrinsic-block-size`
 * custom property. This custom property must be used by styles to control the element's size.
 */
function usePreserveIntrinsicBlockSize({
  isActive,
  element,
}: {
  isActive: boolean
  element: HTMLElement | null
}): void {
  const size = useMemo(() => new Subject<DOMRect | undefined>(), [])
  // Kept synchronous: this drives an imperative style write
  // (`--intrinsic-block-size`) that preserves layout during activation, so a
  // deferred snapshot lagging the latest ResizeObserver measurement could
  // cause visible layout jumps.
  const currentSize = useSyncObservable(size, undefined)

  useEffect(() => {
    const resizeObserver = new ResizeObserver(([entry]) => {
      if (!isActive) {
        size.next(entry.contentRect)
      }
    })

    if (element) {
      resizeObserver.observe(element)
    }

    return () => resizeObserver.disconnect()
  }, [isActive, element, size])

  useEffect(() => {
    if (!element || !currentSize) {
      return () => {}
    }

    const INTRINSIC_BLOCK_SIZE_CUSTOM_PROPERTY = '--intrinsic-block-size'
    const cleanUp = () => element.style.removeProperty(INTRINSIC_BLOCK_SIZE_CUSTOM_PROPERTY)

    if (isActive) {
      element?.style.setProperty(INTRINSIC_BLOCK_SIZE_CUSTOM_PROPERTY, `${currentSize.height}px`)
      return cleanUp
    }

    cleanUp()
    return () => {}
  }, [element, currentSize, isActive])
}
