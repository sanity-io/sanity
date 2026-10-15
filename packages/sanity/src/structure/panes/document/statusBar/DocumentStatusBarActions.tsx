import {LayerProvider, Text} from '@sanity/ui'
import {lazy, memo, Suspense, use, useCallback, useEffect, useMemo, useState} from 'react'
import {
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  DocumentGroupInventory,
  DocumentGroupInventoryAction,
  type DocumentGroupInventoryComponents,
  getReleaseIdFromReleaseDocumentId,
  Hotkeys,
  isGoingToUnpublish,
  isSanityDefinedAction,
  getDocumentVersionVariantId,
  readVersionType,
  useClient,
  useDocumentStore,
  usePausedScheduledDraft,
  usePerspective,
  useSetVariant,
  useSource,
  type VersionInfoDocumentStub,
} from 'sanity'
import {TasksModePromiseContext} from 'sanity/_singletons'
import {Flex, VStack} from 'ui5'

import {Button} from '../../../../ui-components/button/Button'
import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'
import {ReferencePreviewLink} from '../../../components/confirmDeleteDialog/ReferencePreviewLink'
import {referringDocuments} from '../../../components/confirmDeleteDialog/useReferringDocuments'
import {VersionsPreviewList} from '../../../components/confirmDeleteDialog/VersionsPreviewList'
import {DocTitle} from '../../../components/DocTitle'
import {usePaneRouter} from '../../../components/paneRouter/usePaneRouter'
import {
  RenderActionCollectionState,
  type ResolvedAction,
} from '../../../components/RenderActionCollectionState'
import {DOCUMENT_PANEL_PORTAL_ELEMENT} from '../../../constants'
import {useHistoryRestoreAction} from '../../../documentActions/HistoryRestoreAction'
import {useDocumentPerspectiveList} from '../../../hooks/useDocumentPerspectiveList'
import {toLowerCaseNoSpaces} from '../../../util/toLowerCaseNoSpaces'
import {useDocumentPane} from '../useDocumentPane'
import {ActionMenuButton} from './ActionMenuButton'
import {ActionStateDialog} from './ActionStateDialog'

const documentGroupInventoryComponents: DocumentGroupInventoryComponents = {
  DocTitle,
  ReferencePreviewLink,
  VersionsPreviewList,
}

// The open-tasks footer button needs the tasks store and navigation internals, which stay
// private to `src/core/tasks` rather than becoming an entry point other plugins could reach.
// Loading the module here, instead of through the plugin's `__internal_tasks` config, keeps
// that access inside the package while still deferring the chunk until tasks are known to be on.
const loadTasksFooterOpenTasks = () =>
  // oxlint-disable-next-line boundaries/dependencies -- deliberately bypasses the `sanity` entry: exporting this component would make it an entry point other plugins could reach, which is what the direct import avoids. A proper API for footer actions is the long-term alternative.
  import('../../../../core/tasks/plugin/TasksFooterOpenTasks')

const TasksFooterOpenTasks = lazy(loadTasksFooterOpenTasks)

function MaybeTasksFooter() {
  const tasksModePromise = use(TasksModePromiseContext)
  // `TasksStudioProvider` only provides the promise when the tasks plugin is part of the workspace.
  if (tasksModePromise === null) return null
  const tasksMode = use(tasksModePromise)
  if (tasksMode === null) return null
  return <TasksFooterOpenTasks />
}

interface DocumentStatusBarActionsInnerProps {
  disabled: boolean
  states: ResolvedAction[]
}

const DocumentStatusBarActionsInner = memo(function DocumentStatusBarActionsInner(
  props: DocumentStatusBarActionsInnerProps,
) {
  const {disabled, states} = props
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const {beta} = useSource()
  const tasksModePromise = use(TasksModePromiseContext)

  // `MaybeTasksFooter` suspends on this promise before it can render the lazy footer, so the
  // chunk would not start until the feature check settled. The status bar itself commits either
  // way, and this effect starts the import alongside that check.
  useEffect(() => {
    if (tasksModePromise === null) return
    void loadTasksFooterOpenTasks()
  }, [tasksModePromise])

  const {
    displayed,
    editState,
    isDocumentGroupInventoryActive,
    setIsDocumentGroupInventoryActive,
    documentId,
    documentType,
  } = useDocumentPane()
  const {params} = usePaneRouter()

  const showingRevision = Boolean(params?.rev)

  const perspectiveList = useDocumentPerspectiveList()
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const documentStore = useDocumentStore()
  const referringDocuments$ = useMemo(
    () => referringDocuments({documentId, versionedClient: client, documentStore}),
    [documentId, client, documentStore],
  )

  const requestDocumentGroupInventoryClose = useCallback(
    () => setIsDocumentGroupInventoryActive(false),
    [setIsDocumentGroupInventoryActive],
  )

  const setVariant = useSetVariant()

  // Picking a version in the inventory switches the pane to it.
  const selectDocumentGroupVariant = useCallback(
    (document: VersionInfoDocumentStub) => {
      let bundle

      switch (readVersionType(document)) {
        case 'release':
          bundle = getReleaseIdFromReleaseDocumentId(document._system.release?._ref ?? '')
          break
        case 'published':
          bundle = 'published'
          break
        case 'draft':
          bundle = 'drafts'
          break
        case 'agent':
          bundle = document._system.bundleId
      }

      const variantId = getDocumentVersionVariantId(document)

      setVariant({variantId, perspective: bundle})
    },
    [setVariant],
  )

  const {selectedReleaseId} = usePerspective()
  const [firstActionState, ...menuActionStates] = states
  const [buttonElement, setButtonElement] = useState<HTMLButtonElement | null>(null)
  const {isPaused} = usePausedScheduledDraft()
  const hasDocumentGroupInventory = beta?.documentGroupInventory?.enabled === true

  // TODO: This could be refactored to use the tooltip from the button if the firstAction.title was updated to a string.
  const tooltipContent = useMemo(() => {
    if (!firstActionState || (!firstActionState.title && !firstActionState.shortcut)) return null

    return (
      <Flex style={{maxWidth: 300}} alignItems="center" gap={3}>
        {firstActionState.title && <Text size={1}>{firstActionState.title}</Text>}
        {firstActionState.shortcut && (
          <Hotkeys
            data-testid="document-status-bar-hotkeys"
            fontSize={1}
            style={{marginTop: -4, marginBottom: -4}}
            keys={String(firstActionState.shortcut)
              .split('+')
              .map((s) => s.slice(0, 1).toUpperCase() + s.slice(1).toLowerCase())}
          />
        )}
      </Flex>
    )
  }, [firstActionState])

  const shouldShowScheduleAsFirstActionButton = firstActionState?.action === 'schedule' && isPaused

  const showFirstActionButton = showingRevision
    ? Boolean(firstActionState)
    : selectedReleaseId
      ? // For paused drafts, only allow 'schedule' action as primary
        // Otherwise, only show custom (non-Sanity-defined) actions as primary
        firstActionState &&
        (shouldShowScheduleAsFirstActionButton || !isSanityDefinedAction(firstActionState))
      : firstActionState && (!editState?.liveEdit || editState?.version)

  const sideMenuItems = useMemo(() => {
    return showFirstActionButton
      ? menuActionStates
      : [firstActionState, ...menuActionStates].filter(Boolean)
  }, [showFirstActionButton, firstActionState, menuActionStates])

  // When a document is designated to be unpublished in a release, the published
  // document is displayed instead.
  //
  // The document group inventory must always reflect the intended document id,
  // even if the document pane decided to display a different document for some
  // reason.
  //
  // In the future, this would be more robust if `DocumentPaneProvider`
  // exposed both the displayed document and the original source document.
  const targetDocumentId =
    editState?.version && isGoingToUnpublish(editState?.version)
      ? editState.version._id
      : displayed?._id

  return (
    <Flex alignItems="center" gap={3}>
      <Suspense>
        <MaybeTasksFooter />
      </Suspense>
      {hasDocumentGroupInventory && typeof targetDocumentId !== 'undefined' && (
        <DocumentGroupInventoryAction
          documentId={targetDocumentId}
          portalElementName={DOCUMENT_PANEL_PORTAL_ELEMENT}
          isDocumentGroupInventoryActive={isDocumentGroupInventoryActive}
          setIsDocumentGroupInventoryActive={setIsDocumentGroupInventoryActive}
        >
          <DocumentGroupInventory
            mode="manage"
            documentId={targetDocumentId}
            documentType={documentType}
            portalElementName={DOCUMENT_PANEL_PORTAL_ELEMENT}
            perspectiveList={perspectiveList}
            referringDocuments$={referringDocuments$}
            requestClose={requestDocumentGroupInventoryClose}
            components={documentGroupInventoryComponents}
            onSelect={selectDocumentGroupVariant}
          />
        </DocumentGroupInventoryAction>
      )}
      {showFirstActionButton && (
        <LayerProvider zOffset={200}>
          <Tooltip disabled={!tooltipContent} content={tooltipContent} placement="top">
            <VStack>
              <Button
                data-testid={`action-${toLowerCaseNoSpaces(firstActionState.label)}`}
                disabled={disabled || Boolean(firstActionState.disabled)}
                icon={firstActionState.icon}
                onClick={firstActionState.onHandle}
                ref={setButtonElement}
                text={firstActionState.label}
                tone={firstActionState.tone || 'primary'}
              />
            </VStack>
          </Tooltip>
        </LayerProvider>
      )}
      {sideMenuItems.length > 0 && (
        <ActionMenuButton actionStates={sideMenuItems} disabled={disabled} />
      )}
      {showFirstActionButton && firstActionState && firstActionState.dialog && (
        <ActionStateDialog dialog={firstActionState.dialog} referenceElement={buttonElement} />
      )}
    </Flex>
  )
})

export const DocumentStatusBarActions = memo(function DocumentStatusBarActions() {
  return (
    <RenderActionCollectionState group="default">
      {({states}) => <RenderDocumentStatusBarActions states={states} />}
    </RenderActionCollectionState>
  )
})

function RenderDocumentStatusBarActions(props: {states: ResolvedAction[]}) {
  const {connectionState, documentId} = useDocumentPane()

  // The restore action has a dedicated place in the UI; it's only visible when the user is viewing
  // a different document revision. It must be omitted from this collection.
  const states = props.states.filter((state) =>
    state.action ? state.action !== useHistoryRestoreAction.action : true,
  )

  return (
    <DocumentStatusBarActionsInner
      // Use document ID as key to make sure that the actions state is reset when the document changes
      key={documentId}
      disabled={connectionState !== 'connected'}
      states={states}
    />
  )
}

export const HistoryStatusBarActions = memo(function HistoryStatusBarActions() {
  return (
    <RenderActionCollectionState group="default">
      {({states}) => <RenderHistoryStatusBarActions states={states} />}
    </RenderActionCollectionState>
  )
})

function RenderHistoryStatusBarActions({states}: {states: ResolvedAction[]}) {
  const {connectionState, editState, revisionId: revision} = useDocumentPane()

  const disabled = (editState?.draft || editState?.published || {})._rev === revision

  return (
    <DocumentStatusBarActionsInner
      disabled={connectionState !== 'connected' || Boolean(disabled)}
      // If multiple `restore` actions are defined, ensure only the final one is used.
      states={states
        .filter((state) => (state.action ? state.action === useHistoryRestoreAction.action : false))
        .slice(-1)}
    />
  )
}
