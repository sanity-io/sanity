import {LinkIcon, TrashIcon} from '@sanity/icons'
import {Menu} from '@sanity/ui'
import React from 'react'
import {MenuButton, MenuItem} from '../../../../../ui'
import {useTranslation} from '../../../../i18n'
import {AssetMenuAction} from '../types'
import {ContextMenuButton} from '../../../../../ui/contextMenuButton'

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
        <ContextMenuButton
          mode={border ? 'ghost' : triggerButtonMode}
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
