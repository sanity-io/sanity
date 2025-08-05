/* eslint-disable camelcase */
import {Flex, LayerProvider, Stack, Text} from '@sanity/ui'
import {memo, useCallback, useMemo, useState} from 'react'
import {
  type DocumentActionComponent,
  type DocumentActionDescription,
  type DocumentActionProps,
  Hotkeys,
  isSanityDefinedAction,
  usePerspective,
  useSource,
} from 'sanity'

import {Button, Tooltip} from '../../../../ui-components'
import {RenderActionCollectionState, type ResolvedAction} from '../../../components'
import {HistoryRestoreAction} from '../../../documentActions'
import {toLowerCaseNoSpaces} from '../../../util/toLowerCaseNoSpaces'
import {useDocumentPane} from '../useDocumentPane'
import {ActionMenuButton} from './ActionMenuButton'
import {ActionStateDialog} from './ActionStateDialog'

interface DocumentStatusBarActionsInnerProps {
  disabled: boolean
  states: ResolvedAction[]
}

const FirstActionButton = ({
  firstActionState,
  disabled,
}: {
  firstActionState: ResolvedAction
  disabled: boolean
}) => {
  const [buttonElement, setButtonElement] = useState<HTMLButtonElement | null>(null)

  // TODO: This could be refactored to use the tooltip from the button if the firstAction.title was updated to a string.
  const tooltipContent = useMemo(() => {
    if (!firstActionState.title && !firstActionState.shortcut) return null

    return (
      <Flex style={{maxWidth: 300}} align="center" gap={3}>
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

  return (
    <>
      <LayerProvider zOffset={200}>
        <Tooltip disabled={!tooltipContent} content={tooltipContent} placement="top">
          <Stack>
            <Button
              data-testid={`action-${toLowerCaseNoSpaces(firstActionState.label)}`}
              disabled={disabled || Boolean(firstActionState.disabled)}
              icon={firstActionState.icon}
              // eslint-disable-next-line react/jsx-handler-names
              onClick={firstActionState.onHandle}
              ref={setButtonElement}
              text={firstActionState.label}
              tone={firstActionState.tone || 'primary'}
            />
          </Stack>
        </Tooltip>
      </LayerProvider>
      {firstActionState.dialog && (
        <ActionStateDialog dialog={firstActionState.dialog} referenceElement={buttonElement} />
      )}
    </>
  )
}

const DocumentStatusBarActionsInner = memo(function DocumentStatusBarActionsInner(
  props: DocumentStatusBarActionsInnerProps,
) {
  const {disabled, states} = props
  const {__internal_tasks} = useSource()
  const {editState} = useDocumentPane()
  const {selectedReleaseId} = usePerspective()

  const actions = useMemo(() => {
    const [first, ...rest] = states

    const renderActionButton = selectedReleaseId
      ? // If the first action is a custom action and we are in a version document show it.
        first && !isSanityDefinedAction(first)
      : first && !editState?.liveEdit

    if (renderActionButton) {
      // If we show the first action button, we show the first action in the button and the rest in the menu.
      return {actionButton: first, menuActions: rest}
    }

    // If we don't show the first action button, we show all actions in the menu.
    return {actionButton: null, menuActions: states}
  }, [states, editState?.liveEdit, selectedReleaseId])

  return (
    <Flex align="center" gap={1}>
      {__internal_tasks && __internal_tasks.footerAction}
      {actions.actionButton && (
        <FirstActionButton firstActionState={actions.actionButton} disabled={disabled} />
      )}
      {actions.menuActions.length > 0 && (
        <ActionMenuButton actionStates={actions.menuActions} disabled={disabled} />
      )}
    </Flex>
  )
})

export const DocumentStatusBarActions = memo(function DocumentStatusBarActions() {
  const {
    actions: allActions,
    connectionState,
    documentId,
    editState,
    isInitialValueLoading,
  } = useDocumentPane()

  // The restore action has a dedicated place in the UI; it's only visible when the user is viewing
  // a different document revision. It must be omitted from this collection.
  const actions = useMemo(
    () => (allActions ?? []).filter((action) => !isRestoreAction(action)),
    [allActions],
  )
  const actionProps: Omit<DocumentActionProps, 'onComplete'> | null = useMemo(
    () => (editState ? {...editState, initialValueResolved: !isInitialValueLoading} : null),
    [editState, isInitialValueLoading],
  )

  const renderDocumentStatusBarActions = useCallback<
    (props: {states: ResolvedAction[]}) => React.ReactNode
  >(
    ({states}) => (
      <DocumentStatusBarActionsInner
        // Use document ID as key to make sure that the actions state is reset when the document changes
        key={documentId}
        disabled={connectionState !== 'connected'}
        states={states}
      />
    ),
    [connectionState, documentId],
  )

  if (actions.length === 0 || !actionProps) {
    return null
  }

  return (
    <RenderActionCollectionState actions={actions} actionProps={actionProps} group="default">
      {renderDocumentStatusBarActions}
    </RenderActionCollectionState>
  )
})

export const HistoryStatusBarActions = memo(function HistoryStatusBarActions() {
  const {
    actions,
    connectionState,
    editState,
    revisionId: revision,
    isInitialValueLoading,
  } = useDocumentPane()

  const disabled = (editState?.draft || editState?.published || {})._rev === revision
  const actionProps: Omit<DocumentActionProps, 'onComplete'> | null = useMemo(
    () =>
      editState
        ? {
            ...editState,
            revision: revision || undefined,
            initialValueResolved: !isInitialValueLoading,
          }
        : null,
    [editState, revision, isInitialValueLoading],
  )

  // If multiple `restore` actions are defined, ensure only the final one is used.
  const historyActions = useMemo(() => (actions ?? []).filter(isRestoreAction).slice(-1), [actions])

  const renderDocumentStatusBarActions = useCallback<
    (props: {states: DocumentActionDescription[]}) => React.ReactNode
  >(
    ({states}) => (
      <DocumentStatusBarActionsInner
        disabled={connectionState !== 'connected' || Boolean(disabled)}
        states={states}
      />
    ),
    [connectionState, disabled],
  )
  if (!actionProps) {
    return null
  }
  return (
    <RenderActionCollectionState actions={historyActions} actionProps={actionProps} group="default">
      {renderDocumentStatusBarActions}
    </RenderActionCollectionState>
  )
})

export function isRestoreAction(
  action: DocumentActionComponent,
): action is DocumentActionComponent & {action: 'restore'} {
  return action.action === HistoryRestoreAction.action
}
