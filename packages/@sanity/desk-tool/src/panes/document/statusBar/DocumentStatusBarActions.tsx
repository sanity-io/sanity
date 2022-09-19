// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import React, {memo, useCallback, useMemo, useState} from 'react'
import {DocumentActionDescription} from '@sanity/base'
import {Box, Flex, Tooltip, Stack, Button, Hotkeys, LayerProvider, Text, Card} from '@sanity/ui'
import {RenderActionCollectionState} from 'part:@sanity/base/actions/utils'
import {useEditState} from '@sanity/react-hooks'
import {HistoryRestoreAction} from '../../../actions/HistoryRestoreAction'
import {useDocumentPane} from '../useDocumentPane'
import {ActionMenuButton} from './ActionMenuButton'
import {ActionStateDialog} from './ActionStateDialog'
import {LEGACY_BUTTON_COLOR_TO_TONE} from './constants'

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
            <Card flex={1}>
              <Stack>
                <Button
                  data-testid={`action-${firstActionState.label}`}
                  disabled={disabled || Boolean(firstActionState.disabled)}
                  icon={firstActionState.icon}
                  // eslint-disable-next-line react/jsx-handler-names
                  onClick={firstActionState.onHandle}
                  ref={setButtonElement}
                  text={firstActionState.label}
                  tone={
                    firstActionState.color
                      ? LEGACY_BUTTON_COLOR_TO_TONE[firstActionState.color]
                      : 'primary'
                  }
                />
              </Stack>
            </Card>
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
  const {actions, connectionState, documentId, documentType} = useDocumentPane()
  const editState = useEditState(documentId, documentType, 'low')
  const [isMenuOpen, setMenuOpen] = useState(false)
  const handleMenuOpen = useCallback(() => setMenuOpen(true), [])
  const handleMenuClose = useCallback(() => setMenuOpen(false), [])
  const handleActionComplete = useCallback(() => setMenuOpen(false), [])

  if (!actions || !editState) {
    return null
  }

  return (
    <RenderActionCollectionState
      component={DocumentStatusBarActionsInner}
      isMenuOpen={isMenuOpen}
      showMenu={actions.length > 1}
      onMenuOpen={handleMenuOpen}
      onMenuClose={handleMenuClose}
      onActionComplete={handleActionComplete}
      actions={actions}
      actionProps={editState}
      disabled={connectionState !== 'connected'}
    />
  )
})

const historyActions = [HistoryRestoreAction]

export const HistoryStatusBarActions = memo(function HistoryStatusBarActions() {
  const {connectionState, historyController, documentId, documentType} = useDocumentPane()
  const editState = useEditState(documentId, documentType, 'low')
  const revision = historyController.revTime?.id || ''
  const disabled = (editState?.draft || editState?.published || {})._rev === revision
  const actionProps = useMemo(() => ({...(editState || {}), revision}), [editState, revision])

  return (
    <RenderActionCollectionState
      component={DocumentStatusBarActionsInner}
      actions={historyActions}
      actionProps={actionProps}
      disabled={connectionState !== 'connected' || Boolean(disabled)}
    />
  )
})
