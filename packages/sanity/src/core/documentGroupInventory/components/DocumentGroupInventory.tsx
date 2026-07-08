import {EyeOpenIcon} from '@sanity/icons/EyeOpen'
import {FeedbackIcon} from '@sanity/icons/Feedback'
import {SearchIcon} from '@sanity/icons/Search'
import {TrashIcon} from '@sanity/icons/Trash'
import {type SanityDocumentLike} from '@sanity/types'
import {Card, Flex, PortalProvider, Stack, Text, TextInput} from '@sanity/ui'
import {getTheme_v2 as getThemeV2} from '@sanity/ui/theme'
import {useActorRef, useSelector} from '@xstate/react'
import {type ComponentType, useMemo, type ChangeEvent, useState, useEffect} from 'react'
import {useObservable} from 'react-rx'
import {combineLatest, debounceTime, map, type Observable, of, startWith, Subject} from 'rxjs'
import {styled, css} from 'styled-components'
import {type ActorRefFromLogic, fromObservable, fromPromise} from 'xstate'

import {Button} from '../../../ui-components/button/Button'
import {STUDIO_DSN} from '../../error/sentry/sentryErrorReporter'
import {StudioFeedbackDialog} from '../../feedback/components/StudioFeedbackDialog'
import {useFeedbackTelemetry} from '../../feedback/hooks/useFeedbackTelemetry'
import {useClient} from '../../hooks/useClient'
import {useSchema} from '../../hooks/useSchema'
import {useTranslation} from '../../i18n'
import {feedbackLocaleNamespace, studioLocaleNamespace} from '../../i18n/localeNamespaces'
import {type TargetPerspective} from '../../perspective/types'
import {VersionContextMenuDialogs} from '../../releases/components/documentHeader/contextMenu/VersionContextMenuDialogs'
import {VersionContextMenuPopover} from '../../releases/components/documentHeader/contextMenu/VersionContextMenuPopover'
import {ReleaseAvatarIcon} from '../../releases/components/ReleaseAvatar'
import {useDocumentVersionsObservable} from '../../releases/hooks/useDocumentVersions'
import {useVersionContextMenu} from '../../releases/hooks/useVersionContextMenu'
import {useActiveReleases} from '../../releases/store/useActiveReleases'
import {useReleasesStore} from '../../releases/store/useReleasesStore'
import {getReleaseDocumentIdFromReleaseId} from '../../releases/util/getReleaseDocumentIdFromReleaseId'
import {useReleasesToolAvailable} from '../../schedules/hooks/useReleasesToolAvailable'
import {isAgentBundleName} from '../../store'
import {useAgentBundlesStore} from '../../store/agent/useAgentBundles'
import {useWorkspace} from '../../studio'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'
import {
  getPublishedId,
  getVersionFromId,
  isDraftId,
  isPublishedId,
  isVersionId,
} from '../../util/draftUtils'
import {type VariantStoreState} from '../../variants/store/reducer'
import {useVariantsStore} from '../../variants/store/useVariantsStore'
import {deletionMachine, type ReferringDocuments} from '../machines/deletionMachine'
import {documentGroupInventoryMachine} from '../machines/documentGroupInventoryMachine'
import {selectionMachine} from '../machines/selectionMachine'
import {
  type DocumentGroupInventoryPerspectiveList,
  type DocumentGroupInventoryReferencePreviewLinkProps,
} from '../types'
import {Body} from './Body'
import {ConfirmDeleteDialog} from './ConfirmDeleteDialog'
import {Container} from './Container'
import {Footer} from './Footer'
import {Header} from './Header'
import {StatusBadge} from './VariantSet/StatusBadge'
import {VariantCheckbox} from './VariantSet/VariantCheckbox'
import {VariantSet} from './VariantSet/VariantSet'
import {VariantSetEntry} from './VariantSet/VariantSetEntry'
import {VariantSetHeader} from './VariantSet/VariantSetHeader'

/**
 * @internal
 */
export interface DocumentGroupInventoryProps {
  documentId: string
  documentType: string
  /**
   * The name of the portal element used to render popovers and dialogs (e.g.
   * the document panel portal provided by the structure tool).
   */
  portalElementName: string
  /**
   * Navigate to the provided perspective.
   */
  navigatePerspective: (perspective: TargetPerspective) => void
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
  components: {
    DocTitle: ComponentType<{document: SanityDocumentLike}>
    ReferencePreviewLink: ComponentType<DocumentGroupInventoryReferencePreviewLinkProps>
    VersionsPreviewList: ComponentType<{documentType: string; documentVersions: string[]}>
  }
}

/**
 * @internal
 */
export const DocumentGroupInventory: ComponentType<DocumentGroupInventoryProps> = ({
  documentType,
  documentId,
  portalElementName,
  navigatePerspective,
  perspectiveList,
  referringDocuments$,
  components,
}) => {
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
      selectionMachine: useMemo(
        () =>
          selectionMachine.provide({
            actors: {
              filterString: fromObservable(() => filterString),
            },
          }),
        [filterString],
      ),
      deletionMachine: useMemo(
        () =>
          deletionMachine.provide({
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
    },
  })

  const selectionRef = useSelector(inventoryRef, ({context}) => context.selectionRef)
  const deletionRef = useSelector(inventoryRef, ({context}) => context.deletionRef)

  const selectionCount = useSelector(selectionRef, ({context}) => context.selectedIds.size)
  const isReadOnly = useSelector(selectionRef, (snapshot) => snapshot.matches('readonly'))
  const isDeletionActive = useSelector(deletionRef, (snapshot) => snapshot.matches('active'))
  const isFeedbackActive = useSelector(inventoryRef, (snapshot) => snapshot.matches('feedback'))

  const canRequestDeletion = useSelector(deletionRef, (machine) =>
    machine.can({type: 'delete.request'}),
  )

  const hasFilter = useSelector(
    selectionRef,
    ({context}) => typeof context.filterString === 'string',
  )

  usePreserveIntrinsicBlockSize({
    element: containerElement,
    isActive: hasFilter,
  })

  return (
    <>
      <Container ref={setContainerElement} data-testid="document-group-inventory">
        <Header>
          <Stack gap={4}>
            <TextButton onClick={() => inventoryRef.send({type: 'feedback.begin'})}>
              <Text size={1}>
                <Flex gap={2} align="center" justify="flex-end">
                  <FeedbackIcon /> {feedbackT('feedback.menu-item')}
                </Flex>
              </Text>
            </TextButton>
            <search>
              <TextInput
                name={t('document-group-inventory.filter-string.label', {
                  subject: t('document-group.subject.version_other'),
                })}
                placeholder={t('document-group-inventory.filter-string.label', {
                  subject: t('document-group.subject.version_other'),
                })}
                icon={<SearchIcon />}
                readOnly={isReadOnly}
                onChange={(event: ChangeEvent<HTMLInputElement>) => filterStringEvent.next(event)}
              />
            </search>
          </Stack>
        </Header>
        <Body>
          {schema && (
            <Select
              machine={selectionRef}
              inventoryRef={inventoryRef}
              documentType={documentType}
              menuPortalElement={menuPortalElement}
              perspectiveList={perspectiveList}
              onPrimaryAction={(variantId) => {
                let perspective: TargetPerspective | undefined

                switch (true) {
                  case isPublishedId(variantId):
                    perspective = 'published'
                    break
                  case isDraftId(variantId):
                    perspective = 'drafts'
                    break
                  case isVersionId(variantId):
                    perspective = getVersionFromId(variantId)
                    break
                  default:
                    perspective = undefined
                }

                if (typeof perspective !== 'undefined') {
                  navigatePerspective(perspective)
                }
              }}
            />
          )}
        </Body>
        <Footer>
          <Button
            text={t('document-group.delete.confirm-button.text', {count: selectionCount})}
            onClick={() => deletionRef.send({type: 'delete.request'})}
            disabled={!canRequestDeletion}
            tone="critical"
            size="large"
            icon={TrashIcon}
          />
        </Footer>
      </Container>
      <div ref={setMenuPortalElement} />
      {isDeletionActive && (
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
  documentType: string
  onPrimaryAction: (variantId: string) => void
  menuPortalElement: HTMLElement | null
  perspectiveList: DocumentGroupInventoryPerspectiveList
}> = ({
  machine,
  inventoryRef,
  documentType,
  onPrimaryAction,
  menuPortalElement,
  perspectiveList,
}) => {
  const {t} = useTranslation(studioLocaleNamespace)
  const sets = useSelector(inventoryRef, ({context}) => context.sets)

  // For now, selection mode is constant.
  const isSelectable = true

  const hasFilterString = useSelector(
    machine,
    ({context}) => typeof context.filterString !== 'undefined',
  )

  const filterMatchingVariantIds = useSelector(
    machine,
    ({context}) => context.filterMatchingVariantIds,
  )

  return (
    <Stack gap={5}>
      {sets.map((set) => (
        <VariantSet key={set.key}>
          <VariantSetHeader as="header">
            <Text size={1} weight="bold">
              {t('document-group-inventory.title', {
                count: set.variants.length,
                subject: t('document-group.subject.version', {
                  count: set.variants.length,
                }),
              })}
            </Text>
            <TextButton
              onClick={() => {
                set.variants.forEach((variant) =>
                  machine.send({type: 'selection.add', variantId: variant.id}),
                )
              }}
            >
              {/* These strings will be removed in the next iteration, so we've skipped internationalisation. */}
              <Text size={1}>
                {isSelectable
                  ? `Select all ${set.variants.length}`
                  : `${set.variants.length} documents`}
              </Text>
            </TextButton>
          </VariantSetHeader>
          {set.variants
            .filter(({id}) => !hasFilterString || filterMatchingVariantIds.has(id))
            .map((variant) => (
              <Variant
                key={variant.id}
                variant={variant}
                machine={machine}
                inventoryRef={inventoryRef}
                documentType={documentType}
                onPrimaryAction={onPrimaryAction}
                isSelectable={isSelectable}
                menuPortalElement={menuPortalElement}
                perspectiveList={perspectiveList}
              />
            ))}
        </VariantSet>
      ))}
    </Stack>
  )
}

const Variant: ComponentType<{
  variant: {id: string; name: string}
  machine: ActorRefFromLogic<typeof selectionMachine>
  inventoryRef: ActorRefFromLogic<typeof documentGroupInventoryMachine>
  documentType: string
  onPrimaryAction: (variantId: string) => void
  isSelectable: boolean
  menuPortalElement: HTMLElement | null
  perspectiveList: DocumentGroupInventoryPerspectiveList
}> = ({
  variant,
  machine,
  inventoryRef,
  documentType,
  onPrimaryAction,
  isSelectable,
  menuPortalElement,
  perspectiveList,
}) => {
  const {t} = useTranslation(studioLocaleNamespace)
  const releasesToolAvailable = useReleasesToolAvailable()
  const {loading: releasesLoading} = useActiveReleases()
  const isPublishedVersion = isPublishedId(variant.id)
  const isDraftVersion = isDraftId(variant.id)
  const isVersion = isVersionId(variant.id)
  const documentId = getPublishedId(variant.id)
  const versionName = getVersionFromId(variant.id)
  const bundleId = isPublishedVersion ? 'published' : isDraftVersion ? 'draft' : (versionName ?? '')

  const isReadOnly = useSelector(machine, (s) => s.matches('readonly'))
  const selectedIds = useSelector(machine, ({context}) => context.selectedIds)
  const releases = useSelector(inventoryRef, ({context}) => context.releases)

  const {
    filteredReleases,
    getReleaseChipState,
    handleCopyToDraftsNavigate,
    isDraftSelected,
    isPublishSelected,
  } = perspectiveList

  const isSelected =
    (isPublishedVersion && isPublishSelected) ||
    (isDraftVersion && isDraftSelected) ||
    (isVersion && getReleaseChipState(getVersionFromId(variant.id) ?? '').selected)

  const release = versionName
    ? releases.get(getReleaseDocumentIdFromReleaseId(versionName))
    : undefined

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
    openCopyToDraftsDialog,
    handleAddVersion,
    isScheduledDraft,
    scheduledDraftMenuActions,
    sourceReleasePerspective,
  } = useVersionContextMenu({
    documentId,
    documentType,
    bundleId,
    isVersion,
    disabled: isReadOnly,
    release,
  })

  const contextMenuHandler = isReadOnly || !releasesToolAvailable ? undefined : handleContextMenu

  return (
    <>
      <VariantSetEntry
        data-testid={`document-group-inventory-variant-${variant.name.replaceAll(' ', '-')}`}
        data-selected={isSelected || undefined}
      >
        <div className="atom">
          <button
            type="button"
            className="primary-action"
            ref={setReferenceElement}
            onClick={() => onPrimaryAction(variant.id)}
            onContextMenu={contextMenuHandler}
          >
            {variant.name}
          </button>
          {isSelectable && (
            <VariantCheckbox
              checked={selectedIds.has(variant.id)}
              readOnly={isReadOnly}
              onChange={() => {
                machine.send({
                  type: 'selection.toggle',
                  variantId: variant.id,
                })
              }}
            />
          )}
          <Text size={1} weight="bold" className="inert">
            {variant.name}
          </Text>
        </div>
        <div className="atom inert">
          {isSelected && (
            <StatusBadge radius={2} tone="primary">
              <EyeOpenIcon /> {t('document-group-inventory.viewing-item-label')}
            </StatusBadge>
          )}
          <Text size={1}>
            {isAgentBundleName(getVersionFromId(variant.id)) ? (
              <ReleaseAvatarIcon tone="suggest" />
            ) : (
              <ReleaseAvatarIcon
                release={
                  // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals -- this string is not shown to users
                  (isDraftVersion ? 'drafts' : isPublishedVersion ? 'published' : release) ?? ''
                }
              />
            )}
          </Text>
        </div>
      </VariantSetEntry>
      <PortalProvider element={menuPortalElement}>
        <VersionContextMenuPopover
          contextMenu={contextMenu}
          popoverRef={popoverRef}
          referenceElement={referenceElement}
          documentId={documentId}
          documentType={documentType}
          bundleId={bundleId}
          isVersion={isVersion}
          releases={filteredReleases.notCurrentReleases}
          releasesLoading={releasesLoading}
          onDiscard={openDiscardDialog}
          onCreateRelease={openCreateReleaseDialog}
          onCopyToDrafts={openCopyToDraftsDialog}
          onCopyToDraftsNavigate={handleCopyToDraftsNavigate}
          onCreateVersion={handleAddVersion}
          disabled={isReadOnly}
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
        documentId={documentId}
        documentType={documentType}
        bundleId={bundleId}
        isVersion={isVersion}
        title={variant.name}
        sourceReleasePerspective={sourceReleasePerspective}
        onCreateVersion={handleAddVersion}
        onCopyToDraftsNavigate={handleCopyToDraftsNavigate}
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
  const currentSize = useObservable(size)

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

const TextButton = styled.button(({theme}) => {
  const {color} = getThemeV2(theme)

  return css`
    display: inline-block;
    appearance: none;
    border: 0;
    margin: 0;
    padding: 0;
    outline: none;
    all: unset;
    color: ${color.link.fg};

    * {
      color: inherit;
    }

    svg[data-sanity-icon] {
      color: currentColor;
    }
  `
})
