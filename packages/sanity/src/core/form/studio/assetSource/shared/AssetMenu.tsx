import {LinkIcon, TrashIcon} from '@sanity/icons'
import {Menu} from '@sanity/ui'

import {MenuButton} from '../../../../../ui-components/menuButton'
import {MenuItem} from '../../../../../ui-components/menuItem'
import {ContextMenuButton} from '../../../../components/contextMenuButton/ContextMenuButton'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {type AssetMenuAction} from '../types'

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
