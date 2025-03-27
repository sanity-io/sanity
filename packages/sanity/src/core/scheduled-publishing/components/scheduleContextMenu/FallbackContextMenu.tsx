import {TrashIcon} from '@sanity/icons'
import {Menu} from '@sanity/ui'

import {MenuButton} from '../../../../ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../../ui-components/menuItem/MenuItem'
import {ContextMenuButton} from '../../../components/contextMenuButton/ContextMenuButton'
import useScheduleOperation from '../../hooks/useScheduleOperation'
import {type Schedule} from '../../types'

interface Props {
  onDelete?: () => void
  schedule: Schedule
}

/**
 * 'Fallback' context menu used with schedules that don't have any valid associated documentType.
 * Currently, all users can delete schedules that don't have any associated documents, so we don't need to check for permissions here.
 */
export const FallbackContextMenu = (props: Props) => {
  const {onDelete, schedule} = props
  const {deleteSchedule} = useScheduleOperation()

  const handleDelete = () => {
    deleteSchedule({schedule}).then(() => onDelete?.())
  }

  return (
    <MenuButton
      button={<ContextMenuButton />}
      id="contextMenu"
      menu={
        <Menu>
          <MenuItem
            icon={TrashIcon}
            onClick={handleDelete}
            text="Delete schedule"
            tone="critical"
          />
        </Menu>
      }
      popover={{placement: 'left', portal: true, tone: 'default'}}
    />
  )
}
