/* eslint-disable react/no-multi-comp */

import {useEditState} from '@sanity/react-hooks'
import React from 'react'
import {Tooltip} from 'react-tippy'
import Button from 'part:@sanity/components/buttons/default'
import Hotkeys from 'part:@sanity/components/typography/hotkeys'

import styles from './DocumentStatusBarActions.css'
import {ActionMenu} from './ActionMenu'
import {RenderActionCollectionState} from 'part:@sanity/base/actions/utils'
import resolveDocumentActions from 'part:@sanity/base/document-actions/resolver'
import {ActionStateDialog} from './ActionStateDialog'
import {HistoryRestoreAction} from '../../actions/HistoryRestoreAction'

const TOUCH_SUPPORT = 'ontouchstart' in document.documentElement

interface Props {
  id: string
  type: string
  actionStates: any
  isMenuOpen: boolean
  onMenuOpen: () => void
  onMenuClose: () => void
}

function DocumentStatusBarActionsInner(props: Props) {
  const [firstActionState, ...rest] = props.actionStates
  const hasMoreActions = rest.length > 0
  return (
    <div className={props.isMenuOpen ? styles.isMenuOpen : styles.root}>
      {firstActionState && (
        <div className={styles.mainAction}>
          <Tooltip
            arrow
            theme="light"
            disabled={firstActionState.disabled || !firstActionState.hotkeys || TOUCH_SUPPORT}
            className={styles.tooltip}
            html={
              <span className={styles.tooltipHotkeys}>
                <Hotkeys keys={firstActionState.hotkeys} />
              </span>
            }
          >
            <Button
              className={
                hasMoreActions ? styles.mainActionButtonWithMoreActions : styles.mainActionButton
              }
              icon={firstActionState.icon}
              color={firstActionState.disabled ? undefined : firstActionState.color || 'primary'}
              disabled={firstActionState.disabled}
              title={firstActionState.title}
              onClick={firstActionState.onHandle}
            >
              {firstActionState.label}
            </Button>
          </Tooltip>
          {firstActionState.dialog && <ActionStateDialog dialog={firstActionState.dialog} />}
        </div>
      )}
      {hasMoreActions && (
        <ActionMenu
          actionStates={rest}
          isOpen={props.isMenuOpen}
          onOpen={props.onMenuOpen}
          onClose={props.onMenuClose}
        />
      )}
    </div>
  )
}

export function DocumentStatusBarActions(props: Props) {
  const editState = useEditState(props.id, props.type)
  const [isMenuOpen, setMenuOpen] = React.useState(false)

  const actions = editState ? resolveDocumentActions(editState) : null

  return actions ? (
    <RenderActionCollectionState
      component={DocumentStatusBarActionsInner}
      isMenuOpen={isMenuOpen}
      onMenuOpen={() => setMenuOpen(true)}
      onMenuClose={() => setMenuOpen(false)}
      onActionComplete={() => setMenuOpen(false)}
      actions={actions}
      actionProps={editState}
    />
  ) : null
}

interface HistoryStatusBarActionsProps {
  id: string
  type: string
  revision: string
  historyId: string
}

const historyActions = [HistoryRestoreAction]

export function HistoryStatusBarActions(props: HistoryStatusBarActionsProps) {
  const editState: any = useEditState(props.id, props.type)

  if (!editState) {
    return null
  }
  const actionProps = {...editState, historyId: props.historyId, revision: props.revision}
  return (
    <RenderActionCollectionState
      component={DocumentStatusBarActionsInner}
      actions={historyActions}
      actionProps={actionProps}
      onActionComplete={() => {
        /*todo: make optional*/
      }}
    />
  )
}
