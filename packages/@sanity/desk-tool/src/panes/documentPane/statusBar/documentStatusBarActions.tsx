import React, {useCallback, useMemo, useState} from 'react'
import {DocumentActionDescription} from '@sanity/base'
import {EditStateFor} from '@sanity/base/lib/datastores/document/document-pair/editState'
import {useEditState, useConnectionState} from '@sanity/react-hooks'
import {Box, Flex, Tooltip, Stack, Button, Hotkeys, LayerProvider, Text} from '@sanity/ui'
import {RenderActionCollectionState} from 'part:@sanity/base/actions/utils'
import resolveDocumentActions from 'part:@sanity/base/document-actions/resolver'
import {HistoryRestoreAction} from '../../../actions/HistoryRestoreAction'
import {ActionMenuButton} from './actionMenu'
import {ActionStateDialog} from './actionStateDialog'
import {LEGACY_BUTTON_COLOR_TO_TONE} from './constants'

export interface DocumentStatusBarActionsProps {
  disabled: boolean
  showMenu: boolean
  states: DocumentActionDescription[]
}

export interface HistoryStatusBarActionsProps {
  id: string
  type: string
  revision: string
}

function DocumentStatusBarActionsInner(props: DocumentStatusBarActionsProps) {
  const {disabled, showMenu, states} = props
  const [firstActionState, ...menuActionStates] = states
  const [buttonElement, setButtonElement] = useState<HTMLDivElement | null>(null)

  const tooltipContent = useMemo(() => {
    if (!firstActionState || (!firstActionState.title && !firstActionState.shortcut)) return null

    return (
      <Flex padding={2} style={{maxWidth: 300}} align="center">
        <Text size={1} muted>
          {firstActionState.title}
        </Text>
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
                disabled={disabled || Boolean(firstActionState.disabled)}
                icon={firstActionState.icon}
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

export function DocumentStatusBarActions(props: {id: string; type: string}) {
  const {id, type} = props
  const editState: EditStateFor | null = useEditState(id, type) as any
  const connectionState = useConnectionState(id, type)
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
  const {id, revision, type} = props
  const editState: EditStateFor | null = useEditState(id, type) as any
  const connectionState = useConnectionState(id, type)
  const disabled = (editState?.draft || editState?.published || {})._rev === revision
  const actionProps = useMemo(
    () => ({
      ...(editState || {}),
      revision,
    }),
    [editState, revision]
  )

  if (!editState) {
    return null
  }

  return (
    <RenderActionCollectionState
      component={DocumentStatusBarActionsInner}
      actions={historyActions}
      actionProps={actionProps}
      disabled={connectionState !== 'connected' || Boolean(disabled)}
    />
  )
}
