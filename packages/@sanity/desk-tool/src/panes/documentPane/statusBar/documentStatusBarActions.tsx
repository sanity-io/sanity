import React, {useCallback, useState} from 'react'
import {useEditState, useConnectionState} from '@sanity/react-hooks'
import {Box, Flex, Tooltip, Stack, Button, ButtonTone, Hotkeys, Layer, Text} from '@sanity/ui'
import {RenderActionCollectionState} from 'part:@sanity/base/actions/utils'
import resolveDocumentActions from 'part:@sanity/base/document-actions/resolver'
import {ButtonColor} from '@sanity/base/__legacy/@sanity/components'
import {HistoryRestoreAction} from '../../../actions/HistoryRestoreAction'
import {ActionMenu} from './actionMenu'
import {ActionStateDialog} from './actionStateDialog'
import {DocumentStatusBarActionsProps, HistoryStatusBarActionsProps} from './types'

// eslint-disable-next-line complexity
function DocumentStatusBarActionsInner(props: DocumentStatusBarActionsProps) {
  const {states, showMenu} = props
  const [firstActionState, ...menuActionStates] = states
  const [buttonContainerElement, setButtonContainerElement] = useState<HTMLDivElement | null>(null)

  const buttonTone: Record<ButtonColor, ButtonTone> = {
    primary: 'primary',
    warning: 'caution',
    success: 'positive',
    danger: 'critical',
    white: 'default',
  }

  return (
    <Flex>
      {firstActionState && (
        <Stack flex={1}>
          <Layer zOffset={200}>
            <Tooltip
              disabled={!(firstActionState.title || firstActionState.shortcut)}
              content={
                <Flex padding={2} style={{maxWidth: 300}} align="center">
                  <Text size={1} muted>
                    {firstActionState.title}
                  </Text>
                  {firstActionState.shortcut && (
                    <Box marginLeft={firstActionState.title ? 2 : 0}>
                      <Hotkeys keys={String(firstActionState.shortcut).split('+')} />
                    </Box>
                  )}
                </Flex>
              }
              portal
              placement="top"
            >
              <Stack flex={1} ref={setButtonContainerElement}>
                <Button
                  icon={firstActionState.icon}
                  tone={
                    firstActionState.disabled
                      ? 'default'
                      : buttonTone[firstActionState.color] || 'positive'
                  }
                  disabled={props.disabled || Boolean(firstActionState.disabled)}
                  aria-label={firstActionState.title}
                  onClick={firstActionState.onHandle}
                  text={firstActionState.label}
                />
              </Stack>
            </Tooltip>
          </Layer>

          {firstActionState.dialog && (
            <ActionStateDialog
              dialog={firstActionState.dialog}
              referenceElement={buttonContainerElement}
            />
          )}
        </Stack>
      )}

      {showMenu && menuActionStates.length > 0 && (
        <ActionMenu
          actionStates={menuActionStates}
          isOpen={props.isMenuOpen}
          onOpen={props.onMenuOpen}
          onClose={props.onMenuClose}
          disabled={props.disabled}
        />
      )}
    </Flex>
  )
}

export function DocumentStatusBarActions(props: {id: string; type: string}) {
  const editState: any = useEditState(props.id, props.type)
  const connectionState = useConnectionState(props.id, props.type)
  const [isMenuOpen, setMenuOpen] = useState(false)
  const actions = editState ? resolveDocumentActions(editState) : null
  const handleMenuOpen = useCallback(() => setMenuOpen(true), [])
  const handleMenuClose = useCallback(() => setMenuOpen(false), [])
  const handleActionComplete = useCallback(() => setMenuOpen(false), [])

  if (!actions) {
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
}

const historyActions = [HistoryRestoreAction]

export function HistoryStatusBarActions(props: HistoryStatusBarActionsProps) {
  const editState: any = useEditState(props.id, props.type)
  const connectionState = useConnectionState(props.id, props.type)

  if (!editState) {
    return null
  }

  const disabled = (editState.draft || editState.published || {})._rev === props.revision
  const actionProps = {...editState, revision: props.revision}

  return (
    <RenderActionCollectionState
      component={DocumentStatusBarActionsInner}
      actions={historyActions}
      actionProps={actionProps}
      disabled={connectionState !== 'connected' || Boolean(disabled)}
    />
  )
}
