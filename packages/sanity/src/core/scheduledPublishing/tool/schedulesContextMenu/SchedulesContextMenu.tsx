import {CheckmarkIcon, EllipsisVerticalIcon, SortIcon} from '@sanity/icons'
import {Menu} from '@sanity/ui'

import {Button, MenuItem} from '../../../../ui-components'
import {MenuButton} from '../../../../ui-components/menuButton'
import {useSchedules} from '../contexts/schedules'

const SchedulesContextMenu = () => {
  const {setSortBy, sortBy} = useSchedules()

  // Callbacks
  const handleSortByCreateAt = () => setSortBy('createdAt')
  const handleSortByExecuteAt = () => setSortBy('executeAt')

  return (
    <MenuButton
      button={
        <Button
          icon={EllipsisVerticalIcon}
          mode="bleed"
          tone="default"
          tooltipProps={{
            content: 'Sort',
          }}
        />
      }
      id="sort"
      menu={
        <Menu style={{minWidth: '250px'}}>
          <MenuItem
            icon={SortIcon}
            iconRight={sortBy === 'createdAt' ? CheckmarkIcon : undefined}
            onClick={handleSortByCreateAt}
            text="Sort by time added"
          />
          <MenuItem
            icon={SortIcon}
            iconRight={sortBy === 'executeAt' ? CheckmarkIcon : undefined}
            onClick={handleSortByExecuteAt}
            text="Sort by time scheduled"
          />
        </Menu>
      }
    />
  )
}

export default SchedulesContextMenu
