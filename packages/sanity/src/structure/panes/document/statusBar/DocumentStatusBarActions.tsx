/* eslint-disable no-warning-comments */
/* eslint-disable camelcase */
import {Flex, LayerProvider, Stack, Text} from '@sanity/ui'
import {memo, useCallback, useMemo, useState} from 'react'
import {
  type DocumentActionComponent,
  type DocumentActionDescription,
  Hotkeys,
  usePerspective,
  useSource,
} from 'sanity'

import {Button, Tooltip} from '../../../../ui-components'
import {RenderActionCollectionState} from '../../../components'
import {HistoryRestoreAction} from '../../../documentActions'
import {toLowerCaseNoSpaces} from '../../../util/toLowerCaseNoSpaces'
import {useDocumentPane} from '../useDocumentPane'
import {ActionMenuButton} from './ActionMenuButton'
import {ActionStateDialog} from './ActionStateDialog'

interface DocumentStatusBarActionsInnerProps {
  disabled: boolean
  showMenu: boolean
  states: DocumentActionDescription[]
}

const DocumentStatusBarActionsInner = memo(function DocumentStatusBarActionsInner(
  props: DocumentStatusBarActionsInnerProps,
) {
  const {disabled, showMenu, states} = props
  const {__internal_tasks} = useSource()
  const {editState} = useDocumentPane()
  const {selectedReleaseId} = usePerspective()
  const [firstActionState, ...menuActionStates] = states
  const [buttonElement, setButtonElement] = useState<HTMLButtonElement | null>(null)

  // TODO: This could be refactored to use the tooltip from the button if the firstAction.title was updated to a string.
  const tooltipContent = useMemo(() => {
    if (!firstActionState || (!firstActionState.title && !firstActionState.shortcut)) return null

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

  const sideMenuItems = useMemo(() => {
    return selectedReleaseId ? [firstActionState, ...menuActionStates] : menuActionStates
  }, [selectedReleaseId, firstActionState, menuActionStates])

  const canShowAction = firstActionState && !selectedReleaseId && !editState?.liveEdit

  /* Version / Bundling handling */
  return (
    <Flex align="center" gap={1}>
      {__internal_tasks && __internal_tasks.footerAction}
      {canShowAction && (
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
      )}
      {/* if it's in version we always only want to show the items on the side menu and not on the main action */}
      {((showMenu && menuActionStates.length > 0) || selectedReleaseId) && (
        <ActionMenuButton actionStates={sideMenuItems} disabled={disabled} />
      )}
      {firstActionState && firstActionState.dialog && (
        <ActionStateDialog dialog={firstActionState.dialog} referenceElement={buttonElement} />
      )}
    </Flex>
  )
})

export const DocumentStatusBarActions = memo(function DocumentStatusBarActions() {
  const {actions: allActions, connectionState, documentId, editState} = useDocumentPane()
  // const [isMenuOpen, setMenuOpen] = useState(false)
  // const handleMenuOpen = useCallback(() => setMenuOpen(true), [])
  // const handleMenuClose = useCallback(() => setMenuOpen(false), [])
  // const handleActionComplete = useCallback(() => setMenuOpen(false), [])

  // The restore action has a dedicated place in the UI; it's only visible when the user is viewing
  // a different document revision. It must be omitted from this collection.
  const actions = useMemo(
    () => (allActions ?? []).filter((action) => !isRestoreAction(action)),
    [allActions],
  )

  const renderDocumentStatusBarActions = useCallback<
    (props: {states: DocumentActionDescription[]}) => React.ReactNode
  >(
    ({states}) => (
      <DocumentStatusBarActionsInner
        disabled={connectionState !== 'connected'}
        // isMenuOpen={isMenuOpen}
        // onMenuOpen={handleMenuOpen}
        // onMenuClose={handleMenuClose}
        showMenu={actions.length > 1}
        states={states}
        // Use document ID as key to make sure that the actions state is reset when the document changes
        key={documentId}
      />
    ),
    [actions.length, connectionState, documentId],
  )

  if (actions.length === 0 || !editState) {
    return null
  }

  return (
    <RenderActionCollectionState
      // component={}
      // onActionComplete={handleActionComplete}
      actions={actions}
      actionProps={editState}
      group="default"
    >
      {renderDocumentStatusBarActions}
    </RenderActionCollectionState>
  )
})

export const HistoryStatusBarActions = memo(function HistoryStatusBarActions() {
  const {actions, connectionState, editState, revisionId: revision} = useDocumentPane()

  const disabled = (editState?.draft || editState?.published || {})._rev === revision
  const actionProps = useMemo(() => ({...(editState || {}), revision}), [editState, revision])

  // If multiple `restore` actions are defined, ensure only the final one is used.
  const historyActions = useMemo(() => (actions ?? []).filter(isRestoreAction).slice(-1), [actions])

  const renderDocumentStatusBarActions = useCallback<
    (props: {states: DocumentActionDescription[]}) => React.ReactNode
  >(
    ({states}) => (
      <DocumentStatusBarActionsInner
        disabled={connectionState !== 'connected' || Boolean(disabled)}
        showMenu={false}
        states={states}
      />
    ),
    [connectionState, disabled],
  )

  return (
    <RenderActionCollectionState
      actions={historyActions}
      actionProps={actionProps as any}
      group="default"
    >
      {renderDocumentStatusBarActions}
    </RenderActionCollectionState>
  )
})

export function isRestoreAction(
  action: DocumentActionComponent,
): action is DocumentActionComponent & {action: 'restore'} {
  return action.action === HistoryRestoreAction.action
}
