import React from 'react'
import {LinkIcon, EllipsisVerticalIcon, TrashIcon} from '@sanity/icons'
import {Button, Menu, MenuButton} from '@sanity/ui'
import {MenuItem} from '../../../../ui'
import {AssetMenuAction} from './types'

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
      portal
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
      placement="right"
    />
  )
}
