import {EllipsisVerticalIcon, TrashIcon} from '@sanity/icons'
// eslint-disable-next-line no-restricted-imports
import {Button, Menu, MenuButton, MenuItem} from '@sanity/ui'

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
      button={
        <Button icon={EllipsisVerticalIcon} mode="bleed" paddingX={2} paddingY={3} tone="default" />
      }
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
      placement="left"
      popover={{portal: true, tone: 'default'}}
    />
  )
}
