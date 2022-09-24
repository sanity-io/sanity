import React from 'react'
import {EllipsisVerticalIcon, TrashIcon} from '@sanity/icons'
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
      button={<Button icon={EllipsisVerticalIcon} mode="bleed" padding={2} disabled={disabled} />}
      id={id || ''}
      popover={{scheme: 'light', tone: 'default', portal: true}}
      menu={
        <Menu>
          <MenuItem icon={TrashIcon} onClick={onConfirm} text={props.title} tone="critical" />
        </Menu>
      }
      placement={placement}
    />
  )
}
