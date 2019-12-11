import {PublishAction} from './actions/PublishAction'

import {useEditState} from '@sanity/react-hooks'
import React from 'react'
import {Tooltip} from 'react-tippy'
import Button from 'part:@sanity/components/buttons/default'
import Hotkeys from 'part:@sanity/components/typography/hotkeys'

import styles from './DocumentStatusBarActions.css'
import {ActionMenuItems} from './ActionMenu'
import {createAction} from 'part:@sanity/base/util/document-action-utils'

// import customResolveActions from 'part:@sanity/desk-tool/resolve-document-actions?'
//
const actions = [
  PublishAction,
  // DeleteAction,
  createAction(() => {
    const [isDisabled, setDisabled] = React.useState(true)
    const [counter, setCounter] = React.useState(0)
    React.useEffect(() => {
      const id = setInterval(() => {
        setDisabled(() => !isDisabled)
        setCounter(p => p + 1)
      }, 2000)
      return () => {
        clearInterval(id)
      }
    }, [])

    return {
      label: `Hel!lo ${counter} [${isDisabled ? 'disabled' : 'enabled'}]`,
      disabled: isDisabled
    }
  }),
  createAction(() => ({
    label: 'Hello2',
    disabled: true
  })),
  createAction(() => ({
    label: 'Hello [enabled]',
    disabled: false
  })),
  createAction(() => {
    const [isDisabled, setDisabled] = React.useState(false)
    const [counter, setCounter] = React.useState(0)
    React.useEffect(() => {
      const id = setInterval(() => {
        setDisabled(() => !isDisabled)
        setCounter(prev => prev + 1)
      }, 2000)
      return () => {
        clearInterval(id)
      }
    }, [])

    return {
      label: `Hell2o ${counter} [${isDisabled ? 'disabled' : 'enabled'}]`,
      disabled: Math.random() > 0.5
    }
  })
]

const TOUCH_SUPPORT = 'ontouchstart' in document.documentElement

interface Props {
  id: string
  type: string
  editState: any
}

export function DocumentStatusBarActions(props: Props) {
  const editState = useEditState(props.id, props.type)
  return editState ? <DocumentStatusBarActionsInner {...props} editState={editState} /> : null
}

function DocumentStatusBarActionsInner(props: Props) {
  const [isMenuOpen, setMenuOpen] = React.useState(false)

  const [firstAction, ...rest] = actions
  const hasMoreActions = rest.length > 0
  const editState = useEditState(props.id, props.type)
  if (!editState) {
    return null
  }
  const firstActionState = firstAction(editState)
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
        </div>
      )}
      {hasMoreActions && (
        <ActionMenuItems
          editState={props.editState}
          actions={rest}
          isOpen={isMenuOpen}
          onOpen={() => setMenuOpen(true)}
          onClose={() => setMenuOpen(false)}
        />
      )}
    </div>
  )
}
