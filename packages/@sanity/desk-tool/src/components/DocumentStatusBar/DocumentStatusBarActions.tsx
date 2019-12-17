/* eslint-disable react/no-multi-comp */

import {useEditState} from '@sanity/react-hooks'
import React from 'react'
import {Tooltip} from 'react-tippy'
import Button from 'part:@sanity/components/buttons/default'
import Hotkeys from 'part:@sanity/components/typography/hotkeys'

import styles from './DocumentStatusBarActions.css'
import {ActionMenu} from './ActionMenu'
import {RenderActionCollectionState} from 'part:@sanity/base/actions/utils'
import {resolveActions} from 'part:@sanity/base/document-actions/resolver'

const TOUCH_SUPPORT = 'ontouchstart' in document.documentElement

interface Props {
  id: string
  type: string
  actionStates: any
}

function DocumentStatusBarActionsInner(props: Props) {
  const [isMenuOpen, setMenuOpen] = React.useState(false)

  const [firstActionState, ...rest] = props.actionStates
  const hasMoreActions = rest.length > 0
  return (
    <div className={isMenuOpen ? styles.isMenuOpen : styles.root}>
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
              onClick={firstActionState.onHandle}
            >
              {firstActionState.label}
            </Button>
          </Tooltip>
          {firstActionState.dialog && firstActionState.dialog.content}
        </div>
      )}
      {hasMoreActions && (
        <ActionMenu
          actionStates={rest}
          isOpen={isMenuOpen}
          onOpen={() => setMenuOpen(true)}
          onClose={() => setMenuOpen(false)}
        />
      )}
    </div>
  )
}

export function DocumentStatusBarActions(props: Props) {
  const editState = useEditState(props.id, props.type)

  const actions = editState ? resolveActions(editState) : null
  return actions ? (
    <RenderActionCollectionState
      actions={actions}
      args={editState}
      component={DocumentStatusBarActionsInner}
    />
  ) : null
}
