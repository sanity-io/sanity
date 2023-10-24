import {Box, Flex, Tooltip, Stack, Button, LayerProvider, Text} from '@sanity/ui'
import React, {memo, useMemo, useState} from 'react'
import {RenderActionCollectionState} from '../../../components'
import {HistoryRestoreAction} from '../../../documentActions'
import {useDocumentPane} from '../useDocumentPane'
import {ActionMenuButton} from './ActionMenuButton'
import {ActionStateDialog} from './ActionStateDialog'
import {DocumentActionDescription, Hotkeys, useTimelineSelector} from 'sanity'

interface DocumentStatusBarActionsInnerProps {
  disabled: boolean
  showMenu: boolean
  states: DocumentActionDescription[]
}

function DocumentStatusBarActionsInner(props: DocumentStatusBarActionsInnerProps) {
  const {disabled, showMenu, states} = props
  const [firstActionState, ...menuActionStates] = states
  const [buttonElement, setButtonElement] = useState<HTMLButtonElement | null>(null)

  const tooltipContent = useMemo(() => {
    if (!firstActionState || (!firstActionState.title && !firstActionState.shortcut)) return null

    return (
      <Flex padding={2} style={{maxWidth: 300}} align="center">
        <Text size={1}>{firstActionState.title}</Text>
        {firstActionState.shortcut && (
          <Box marginLeft={firstActionState.title ? 2 : 0}>
            <Hotkeys
              keys={String(firstActionState.shortcut)
                .split('+')
                .map((s) => s.slice(0, 1).toUpperCase() + s.slice(1).toLowerCase())}
            />
          </Box>
        )}
      </Flex>
    )
  }, [firstActionState])

  return (
    <Flex>
      {firstActionState && (
        <LayerProvider zOffset={200}>
          <Tooltip disabled={!tooltipContent} content={tooltipContent} portal placement="top">
            <Stack flex={1}>
              <Button
                data-testid={`action-${firstActionState.label}`}
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

      {showMenu && menuActionStates.length > 0 && (
        <Box marginLeft={1}>
          <ActionMenuButton actionStates={menuActionStates} disabled={disabled} />
        </Box>
      )}

      {firstActionState && firstActionState.dialog && (
        <ActionStateDialog dialog={firstActionState.dialog} referenceElement={buttonElement} />
      )}
    </Flex>
  )
}

export const DocumentStatusBarActions = memo(function DocumentStatusBarActions() {
  const {actions, connectionState, documentId, editState} = useDocumentPane()
  // const [isMenuOpen, setMenuOpen] = useState(false)
  // const handleMenuOpen = useCallback(() => setMenuOpen(true), [])
  // const handleMenuClose = useCallback(() => setMenuOpen(false), [])
  // const handleActionComplete = useCallback(() => setMenuOpen(false), [])

  if (!actions || !editState) {
    return null
  }

  return (
    <RenderActionCollectionState
      // component={}
      // onActionComplete={handleActionComplete}
      actions={actions}
      // @ts-expect-error TODO: fix the document actions
      actionProps={editState}
    >
      {({states}) => (
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
      )}
    </RenderActionCollectionState>
  )
})

export const HistoryStatusBarActions = memo(function HistoryStatusBarActions() {
  const {connectionState, editState, timelineStore} = useDocumentPane()

  // Subscribe to external timeline state changes
  const revTime = useTimelineSelector(timelineStore, (state) => state.revTime)

  const revision = revTime?.id || ''
  const disabled = (editState?.draft || editState?.published || {})._rev === revision
  const actionProps = useMemo(() => ({...(editState || {}), revision}), [editState, revision])
  const historyActions = useMemo(() => [HistoryRestoreAction], [])

  return (
    <RenderActionCollectionState actions={historyActions} actionProps={actionProps as any}>
      {({states}) => (
        <DocumentStatusBarActionsInner
          disabled={connectionState !== 'connected' || Boolean(disabled)}
          showMenu={false}
          states={states}
        />
      )}
    </RenderActionCollectionState>
  )
})
