import {TrashIcon} from '@sanity/icons'
import {Menu} from '@sanity/ui'

import {MenuButton, MenuItem} from '../../../../ui-components'
import {ContextMenuButton} from '../../../components/contextMenuButton'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import useScheduleOperation from '../../hooks/useScheduleOperation'
import {scheduledPublishingNamespace} from '../../i18n'
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
  const {t} = useTranslation(scheduledPublishingNamespace)

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
            text={t('schedule-preview.menu-item.delete-schedule')}
            tone="critical"
          />
        </Menu>
      }
      placement="left"
      popover={{portal: true, tone: 'default'}}
    />
  )
}
