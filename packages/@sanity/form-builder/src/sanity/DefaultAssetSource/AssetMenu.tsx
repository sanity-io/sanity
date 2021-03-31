import React from 'react'
import {LinkIcon, EllipsisVerticalIcon, TrashIcon} from '@sanity/icons'
import {Button, Menu, MenuItem, MenuButton} from '@sanity/ui'
import {AssetMenuAction} from './types'

export function AssetMenu({
  isSelected,
  onAction,
}: {
  isSelected: boolean
  onAction: (action: AssetMenuAction) => void
}) {
  return (
    <MenuButton
      button={<Button mode="ghost" icon={EllipsisVerticalIcon} />}
      id="asset-menu"
      portal
      menu={
        <Menu>
          <MenuItem
            text="Find usages"
            icon={LinkIcon}
            onClick={() => {
              onAction({type: 'showUsage'})
            }}
          />
          <MenuItem
            text="Delete"
            icon={TrashIcon}
            tone={isSelected ? undefined : 'critical'}
            disabled={isSelected}
            title={isSelected ? 'Cannot delete current image' : undefined}
            onClick={() => {
              onAction({type: 'delete'})
            }}
          />
        </Menu>
      }
      placement="right"
    />
  )
}
