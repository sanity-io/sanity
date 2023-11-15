import {EllipsisVerticalIcon, LinkIcon, TrashIcon} from '@sanity/icons'
import {Button, Menu, MenuButton, MenuItem} from '@sanity/ui'
import {AssetMenuAction} from '../types'
import {useTranslation} from '../../../../i18n'
import React from 'react'

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

  const {t} = useTranslation()
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
            text={t('asset-source.asset-list.menu.show-usage')}
            icon={LinkIcon}
            onClick={() => {
              onAction({type: 'showUsage'})
            }}
          />
          <MenuItem
            text={t('asset-source.asset-list.menu.delete')}
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
