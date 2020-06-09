/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable react/jsx-handler-names */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable react/no-multi-comp */

import ToggleButton from 'part:@sanity/components/toggles/button'
import React from 'react'
import {OverflowMenu} from './OverflowMenu'
import {PTEToolbarAction, PTEToolbarActionGroup} from './types'

import styles from './ActionMenu.css'

interface Props {
  groups: PTEToolbarActionGroup[]
  readOnly: boolean
}

function ActionButton(props: {action: PTEToolbarAction; disabled: boolean; visible: boolean}) {
  const {action, disabled, visible} = props
  const title = action.hotkeys ? `${action.title} (${action.hotkeys.join('+')})` : action.title

  return (
    <ToggleButton
      aria-hidden={!visible}
      data-visible={visible}
      disabled={disabled}
      icon={action.icon}
      kind="simple"
      padding="small"
      onClick={action.handle}
      tabIndex={visible ? 0 : -1}
      selected={action.active}
      title={title}
    />
  )
}

function ActionMenuItem(props: {action: PTEToolbarAction; disabled: boolean; onClose: () => void}) {
  const {action, disabled, onClose} = props
  const title = action.hotkeys ? `${action.title} (${action.hotkeys.join('+')})` : action.title

  return (
    <button
      className={styles.menuItem}
      disabled={disabled}
      onClick={() => {
        action.handle()
        onClose()
      }}
      type="button"
    >
      <span className={styles.iconContainer}>{React.createElement(action.icon)}</span>
      <span className={styles.title}>{title}</span>
    </button>
  )
}

export default function ActionMenu(props: Props) {
  const {groups, readOnly} = props

  const actions = groups.reduce((acc: PTEToolbarAction[], group) => {
    return acc.concat(
      group.actions.map((action, actionIndex) => {
        if (actionIndex === 0) return {...action, firstInGroup: true}
        return action
      })
    )
  }, [])

  return (
    <OverflowMenu
      actions={actions}
      actionButtonComponent={ActionButton}
      actionMenuItemComponent={ActionMenuItem}
      disabled={readOnly}
    />
  )
}
