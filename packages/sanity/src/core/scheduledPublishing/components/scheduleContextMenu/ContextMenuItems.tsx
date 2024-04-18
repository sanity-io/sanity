import {CalendarIcon, CheckmarkCircleIcon, PublishIcon, TrashIcon} from '@sanity/icons'
import {type SchemaType} from '@sanity/types'

import {useCurrentUser, useDocumentPairPermissions} from '../../../store'
import useScheduleOperation from '../../hooks/useScheduleOperation'
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
          permissionsOperationLabel="edit-schedules"
          title="Edit schedule"
          disabled={mode === 'upsell'}
        />
      )}
      {actions?.execute && (
        <MenuItemWithPermissionsTooltip
          currentUser={currentUser}
          hasPermission={!insufficientPermissions}
          icon={PublishIcon}
          onClick={handleExecute}
          permissionsOperationLabel="execute-schedules"
          title="Publish now"
          disabled={mode === 'upsell'}
        />
      )}
      {actions?.delete && (
        <MenuItemWithPermissionsTooltip
          currentUser={currentUser}
          hasPermission={!insufficientPermissions}
          icon={TrashIcon}
          onClick={handleDelete}
          permissionsOperationLabel="delete-schedules"
          title="Delete schedule"
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
          permissionsOperationLabel="delete-schedules"
          title="Clear completed schedule"
          disabled={mode === 'upsell'}
        />
      )}
    </>
  )
}

export default ContextMenuItems
