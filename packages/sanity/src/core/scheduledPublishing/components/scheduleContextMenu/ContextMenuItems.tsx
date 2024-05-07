import {CalendarIcon, CheckmarkCircleIcon, PublishIcon, TrashIcon} from '@sanity/icons'
import {type SchemaType} from '@sanity/types'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useCurrentUser, useDocumentPairPermissions} from '../../../store'
import useScheduleOperation from '../../hooks/useScheduleOperation'
import {scheduledPublishingNamespace} from '../../i18n'
import {useScheduledPublishingEnabled} from '../../tool/contexts/ScheduledPublishingEnabledProvider'
import {type Schedule} from '../../types'
import {getScheduledDocument} from '../../utils/paneItemHelpers'
import MenuItemWithPermissionsTooltip from './MenuItemWithPermissionsTooltip'

interface Props {
  actions?: {
    clear?: boolean
    delete?: boolean
    edit?: boolean
    execute?: boolean
  }
  onDelete?: () => void
  onEdit?: () => void
  schedule: Schedule
  schemaType: SchemaType
}

const ContextMenuItems = (props: Props) => {
  const {actions, onDelete, onEdit, schedule, schemaType} = props
  const {t} = useTranslation(scheduledPublishingNamespace)
  const {mode} = useScheduledPublishingEnabled()
  const firstDocument = getScheduledDocument(schedule)

  const currentUser = useCurrentUser()
  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id: firstDocument.documentId,
    type: schemaType?.name,
    permission: 'publish',
  })
  const {deleteSchedule, publishSchedule} = useScheduleOperation()

  const insufficientPermissions = !isPermissionsLoading && !permissions?.granted

  // Callbacks
  const handleEdit = () => {
    onEdit?.()
  }

  const handleDelete = () => {
    deleteSchedule({schedule}).then(() => onDelete?.())
  }

  const handleExecute = () => {
    publishSchedule({schedule})
  }

  if (!currentUser) {
    return null
  }

  return (
    <>
      {actions?.edit && (
        <MenuItemWithPermissionsTooltip
          currentUser={currentUser}
          hasPermission={!insufficientPermissions}
          icon={CalendarIcon}
          onClick={handleEdit}
          context="edit-schedules"
          title={t('schedule-preview.menu-item.edit-schedule')}
          disabled={mode === 'upsell'}
        />
      )}
      {actions?.execute && (
        <MenuItemWithPermissionsTooltip
          currentUser={currentUser}
          hasPermission={!insufficientPermissions}
          icon={PublishIcon}
          onClick={handleExecute}
          context="execute-schedules"
          title={t('schedule-preview.menu-item.publish-now')}
          disabled={mode === 'upsell'}
        />
      )}
      {actions?.delete && (
        <MenuItemWithPermissionsTooltip
          currentUser={currentUser}
          hasPermission={!insufficientPermissions}
          icon={TrashIcon}
          onClick={handleDelete}
          context="delete-schedules"
          title={t('schedule-preview.menu-item.delete-schedule')}
          tone="critical"
          disabled={mode === 'upsell'}
        />
      )}
      {actions?.clear && (
        <MenuItemWithPermissionsTooltip
          currentUser={currentUser}
          hasPermission={!insufficientPermissions}
          icon={CheckmarkCircleIcon}
          onClick={handleDelete}
          context="delete-schedules"
          title={t('schedule-preview.menu-item.clear-schedule')}
          disabled={mode === 'upsell'}
        />
      )}
    </>
  )
}

export default ContextMenuItems
