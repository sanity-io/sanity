import {LayerProvider} from '@sanity/ui'
import {lazy, memo, Suspense, use, useEffect, useMemo, useState} from 'react'
import {Hotkeys, isSanityDefinedAction, usePausedScheduledDraft, usePerspective} from 'sanity'
import {TasksModePromiseContext} from 'sanity/_singletons'
import {Text, Flex, VStack} from 'ui5'

import {Button} from '../../../../ui-components/button/Button'
import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'
import {usePaneRouter} from '../../../components/paneRouter/usePaneRouter'
import {
  RenderActionCollectionState,
  type ResolvedAction,
} from '../../../components/RenderActionCollectionState'
import {useHistoryRestoreAction} from '../../../documentActions/HistoryRestoreAction'
import {toLowerCaseNoSpaces} from '../../../util/toLowerCaseNoSpaces'
import {useDocumentPane} from '../useDocumentPane'
import {ActionMenuButton} from './ActionMenuButton'
import {ActionStateDialog} from './ActionStateDialog'

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
  const tasksModePromise = use(TasksModePromiseContext)

  // `MaybeTasksFooter` suspends on this promise before it can render the lazy footer, so the
  // chunk would not start until the feature check settled. The status bar itself commits either
  // way, and this effect starts the import alongside that check.
  useEffect(() => {
    if (tasksModePromise === null) return
    void loadTasksFooterOpenTasks()
  }, [tasksModePromise])

  const {editState} = useDocumentPane()
  const {params} = usePaneRouter()

  const showingRevision = Boolean(params?.rev)

  const {selectedReleaseId} = usePerspective()
  const [firstActionState, ...menuActionStates] = states
  const [buttonElement, setButtonElement] = useState<HTMLButtonElement | null>(null)
  const {isPaused} = usePausedScheduledDraft()

  // TODO: This could be refactored to use the tooltip from the button if the firstAction.title was updated to a string.
  const tooltipContent = useMemo(() => {
    if (!firstActionState || (!firstActionState.title && !firstActionState.shortcut)) return null

    return (
      <Flex style={{maxWidth: 300}} alignItems="center" gap={3}>
        {firstActionState.title && (
          <Text size={1} as="div" trim={true}>
            {firstActionState.title}
          </Text>
        )}
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

  return (
    <Flex alignItems="center" gap={3}>
      <Suspense>
        <MaybeTasksFooter />
      </Suspense>
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
