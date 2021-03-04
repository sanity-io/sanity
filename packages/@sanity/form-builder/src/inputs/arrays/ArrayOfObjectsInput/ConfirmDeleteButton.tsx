import React from 'react'
import {TrashIcon} from '@sanity/icons'
import {Button, Menu, MenuButton, MenuItem, Placement} from '@sanity/ui'
import {useId} from '@reach/auto-id'

export function ConfirmDeleteButton(props: {
  title: string
  onConfirm: () => void
  placement?: Placement
  disabled?: boolean
}) {
  const {onConfirm, placement = 'left', disabled} = props
  const id = useId()
  return (
    <MenuButton
      id={id || ''}
      button={<Button mode="bleed" icon={TrashIcon} disabled={disabled} />}
      placement={placement}
      portal={false}
      menu={
        <Menu>
          <MenuItem color="danger" onClick={onConfirm} tone="critical" text={props.title} />
        </Menu>
      }
    />
  )
}
