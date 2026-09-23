import {CalendarIcon} from '@sanity/icons/Calendar'
import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {PublishIcon} from '@sanity/icons/Publish'
import {TrashIcon} from '@sanity/icons/Trash'
import {type SchemaType} from '@sanity/types'

import {useScheduledPublishingEnabled} from '../../../scheduledPublishing/contexts/ScheduledPublishingEnabledProvider'
import {useDocumentPairPermissions} from '../../../store/grants/documentPairPermissions'
import {useCurrentUser} from '../../../store/user/hooks'
import useScheduleOperation from '../../hooks/useScheduleOperation'
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

/**
 * Edit, Delete and Clear stay ungated by `document.actions` because none of them maps to an
 * honest document action id: deleting a schedule doesn't delete the document, and legacy
 * schedules aren't versions, so there's no `discardVersion` either. Edit's in-pane call site
 * already sits behind `useScheduleAction.action = 'schedule'`. Publish now hits the same
 * schedules API, but it resolves to a real document publish, so its call site gates on `publish`.
 */
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
    void deleteSchedule({schedule}).then(() => onDelete?.())
  }

  const handleExecute = () => {
    void publishSchedule({schedule})
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
