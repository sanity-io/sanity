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
      button={<Button icon={TrashIcon} mode="bleed" disabled={disabled} />}
      id={id || ''}
      menu={
        <Menu>
          <MenuItem
            color="danger"
            icon={TrashIcon}
            onClick={onConfirm}
            text={props.title}
            tone="critical"
          />
        </Menu>
      }
      placement={placement}
      portal={false}
    />
  )
}
