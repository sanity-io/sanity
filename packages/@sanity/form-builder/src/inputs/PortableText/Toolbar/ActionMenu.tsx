import Button from 'part:@sanity/components/buttons/default'
import React, {useCallback} from 'react'
import {PortableTextEditor, usePortableTextEditor} from '@sanity/portable-text-editor'
import {OverflowMenu} from './OverflowMenu'
import {PTEToolbarAction, PTEToolbarActionGroup} from './types'

import styles from './ActionMenu.css'

interface Props {
  disabled: boolean
  groups: PTEToolbarActionGroup[]
  readOnly: boolean
}

function ActionButton(props: {action: PTEToolbarAction; disabled: boolean; visible: boolean}) {
  const {action, disabled, visible} = props
  const title = action.hotkeys ? `${action.title} (${action.hotkeys.join('+')})` : action.title

  const handleClick = useCallback(() => {
    action.handle()
  }, [action])

  return (
    <Button
      aria-hidden={!visible}
      data-visible={visible}
      disabled={disabled}
      icon={action.icon}
      kind="simple"
      padding="small"
      onClick={handleClick}
      tabIndex={visible ? 0 : -1}
      selected={action.active}
      title={title}
    />
  )
}

function ActionMenuItem(props: {action: PTEToolbarAction; disabled: boolean; onClose: () => void}) {
  const {action, disabled, onClose} = props
  const title = action.hotkeys ? `${action.title} (${action.hotkeys.join('+')})` : action.title

  const handleClick = useCallback(() => {
    action.handle()
    onClose()
  }, [action])

  return (
    <Button
      bleed
      className={styles.menuItem}
      disabled={disabled}
      icon={action.icon}
      kind="simple"
      onClick={handleClick}
      selected={action.active}
    >
      {title}
    </Button>
  )
}

export default function ActionMenu(props: Props) {
  const {disabled, groups, readOnly} = props
  const editor = usePortableTextEditor()
  const focusBlock = PortableTextEditor.focusBlock(editor)
  const focusChild = PortableTextEditor.focusChild(editor)
  const ptFeatures = PortableTextEditor.getPortableTextFeatures(editor)

  const isNotText =
    (focusBlock && focusBlock._type !== ptFeatures.types.block.name) ||
    (focusChild && focusChild._type !== ptFeatures.types.span.name)

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
      disabled={disabled || readOnly || isNotText}
    />
  )
}
