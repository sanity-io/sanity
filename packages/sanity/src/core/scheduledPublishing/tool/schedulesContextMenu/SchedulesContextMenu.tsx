import {CheckmarkIcon, SortIcon} from '@sanity/icons'
import {Menu} from '@sanity/ui'

import {MenuItem} from '../../../../ui-components'
import {MenuButton} from '../../../../ui-components/menuButton'
import {ContextMenuButton} from '../../../components/contextMenuButton'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {scheduledPublishingNamespace} from '../../i18n'
import {useSchedules} from '../contexts/schedules'

const SchedulesContextMenu = () => {
  const {setSortBy, sortBy} = useSchedules()

  const {t} = useTranslation(scheduledPublishingNamespace)
  // Callbacks
  const handleSortByCreateAt = () => setSortBy('createdAt')
  const handleSortByExecuteAt = () => setSortBy('executeAt')

  return (
    <MenuButton
      button={<ContextMenuButton />}
      id="sort"
      menu={
        <Menu style={{minWidth: '250px'}}>
          <MenuItem
            icon={SortIcon}
            iconRight={sortBy === 'createdAt' ? CheckmarkIcon : undefined}
            onClick={handleSortByCreateAt}
            text={t('actions.sort.by-added')}
          />
          <MenuItem
            icon={SortIcon}
            iconRight={sortBy === 'executeAt' ? CheckmarkIcon : undefined}
            onClick={handleSortByExecuteAt}
            text={t('actions.sort.by-scheduled')}
          />
        </Menu>
      }
    />
  )
}

export default SchedulesContextMenu
