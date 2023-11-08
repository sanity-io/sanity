import React from 'react'
import {EllipsisVerticalIcon, LinkIcon, TrashIcon} from '@sanity/icons'
import {Button, Menu, MenuButton, MenuItem} from '@sanity/ui'
import {AssetMenuAction} from '../types'

const MENU_POPOVER_PROPS = {portal: true, placement: 'right'} as const

export function AssetMenu({
  isSelected,
  border = true,
  onAction,
}: {
  isSelected: boolean
  border?: boolean
  onAction: (action: AssetMenuAction) => void
}) {
  const triggerButtonMode = isSelected ? 'default' : 'bleed'
  const triggerButtonTone = isSelected ? 'primary' : 'default'

  return (
    <MenuButton
      button={
        <Button
          padding={2}
          mode={border ? 'ghost' : triggerButtonMode}
          icon={EllipsisVerticalIcon}
          tone={border ? 'default' : triggerButtonTone}
        />
      }
      id="asset-menu"
      menu={
        <Menu>
          <MenuItem
            text="Show uses"
            icon={LinkIcon}
            onClick={() => {
              onAction({type: 'showUsage'})
            }}
          />
          <MenuItem
            text="Delete"
            icon={TrashIcon}
            tone="critical"
            onClick={() => {
              onAction({type: 'delete'})
            }}
          />
        </Menu>
      }
      popover={MENU_POPOVER_PROPS}
    />
  )
}
