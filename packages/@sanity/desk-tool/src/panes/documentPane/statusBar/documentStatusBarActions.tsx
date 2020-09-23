import React, {useCallback, useState} from 'react'
import {useEditState, useConnectionState} from '@sanity/react-hooks'
import {Tooltip} from 'part:@sanity/components/tooltip'
import Button from 'part:@sanity/components/buttons/default'
import Hotkeys from 'part:@sanity/components/typography/hotkeys'
import {RenderActionCollectionState} from 'part:@sanity/base/actions/utils'
import resolveDocumentActions from 'part:@sanity/base/document-actions/resolver'
import {HistoryRestoreAction} from '../../../actions/HistoryRestoreAction'
import {ActionMenu} from './actionMenu'
import {ActionStateDialog} from './actionStateDialog'
import {DocumentStatusBarActionsProps, HistoryStatusBarActionsProps} from './types'

import styles from './documentStatusBarActions.css'

const TOUCH_SUPPORT = 'ontouchstart' in document.documentElement

// eslint-disable-next-line complexity
function DocumentStatusBarActionsInner(props: DocumentStatusBarActionsProps) {
  const {states, showMenu} = props
  const [firstActionState, ...menuActionStates] = states
  const [buttonContainerElement, setButtonContainerElement] = useState<HTMLDivElement | null>(null)

  return (
    <div className={props.isMenuOpen ? styles.isMenuOpen : styles.root}>
      {firstActionState && (
        <div className={styles.mainAction}>
          <Tooltip
            disabled={TOUCH_SUPPORT || !(firstActionState.title || firstActionState.shortcut)}
            className={styles.tooltip}
            content={
              <div className={styles.tooltipBox}>
                {firstActionState.title && (
                  <span className={styles.tooltipTitle}>{firstActionState.title}</span>
                )}
                {firstActionState.shortcut && (
                  <span className={styles.tooltipHotkeys}>
                    <Hotkeys keys={String(firstActionState.shortcut).split('+')} size="small" />
                  </span>
                )}
              </div>
            }
            placement="top"
          >
            <div ref={setButtonContainerElement}>
              <Button
                className={
                  showMenu ? styles.mainActionButtonWithMoreActions : styles.mainActionButton
                }
                icon={firstActionState.icon}
                color={firstActionState.disabled ? undefined : firstActionState.color || 'success'}
                disabled={props.disabled || Boolean(firstActionState.disabled)}
                aria-label={firstActionState.title}
                onClick={firstActionState.onHandle}
              >
                {firstActionState.label}
              </Button>
            </div>
          </Tooltip>

          {firstActionState.dialog && (
            <ActionStateDialog
              dialog={firstActionState.dialog}
              referenceElement={buttonContainerElement}
            />
          )}
        </div>
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
    </div>
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
