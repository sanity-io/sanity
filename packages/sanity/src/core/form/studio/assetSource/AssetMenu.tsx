import React from 'react'
import {LinkIcon, EllipsisHorizontalIcon, TrashIcon} from '@sanity/icons'
import {Menu, MenuButton} from '@sanity/ui'
import {Button, MenuItem} from '../../../../ui'
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
          size="small"
          mode={border ? 'ghost' : triggerButtonMode}
          icon={EllipsisHorizontalIcon}
          tone={border ? 'default' : triggerButtonTone}
          tooltipProps={{content: 'Show more'}}
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
