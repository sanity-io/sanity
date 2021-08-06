import React from 'react'
import {LinkIcon, EllipsisVerticalIcon, TrashIcon} from '@sanity/icons'
import {Button, Menu, MenuItem, MenuButton} from '@sanity/ui'
import {AssetMenuAction} from './types'

export function AssetMenu({
  isSelected,
  border = true,
  disabledDeleteTitle = 'Cannot delete current image',
  onAction,
}: {
  isSelected: boolean
  border?: boolean
  disabledDeleteTitle?: string
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
            title={isSelected ? disabledDeleteTitle : undefined}
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
