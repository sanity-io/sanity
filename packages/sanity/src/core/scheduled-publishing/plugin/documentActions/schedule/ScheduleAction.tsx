import {CalendarIcon, ClockIcon} from '@sanity/icons'
import {Box, Text} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {InsufficientPermissionsMessage} from '../../../../components/InsufficientPermissionsMessage'
import {
  type DocumentActionComponent,
  type DocumentActionDialogProps,
  type DocumentActionProps,
} from '../../../../config/document/actions'
import {useScheduledPublishingEnabled} from '../../../../scheduledPublishing/contexts/ScheduledPublishingEnabledProvider'
import {useDocumentPairPermissions} from '../../../../store/_legacy/grants/documentPairPermissions'
import {useCurrentUser} from '../../../../store/user/hooks'
import {debugWithName} from '../../../../studio/timezones/utils/debug'
import DialogFooter from '../../../components/dialogs/DialogFooter'
import DialogHeader from '../../../components/dialogs/DialogHeader'
import {EditScheduleForm} from '../../../components/editScheduleForm/EditScheduleForm'
import ErrorCallout from '../../../components/errorCallout/ErrorCallout'
import {SCHEDULED_PUBLISHING_TIME_ZONE_SCOPE} from '../../../constants'
import {DocumentActionPropsProvider} from '../../../contexts/documentActionProps'
import usePollSchedules from '../../../hooks/usePollSchedules'
import useScheduleForm from '../../../hooks/useScheduleForm'
import useScheduleOperation from '../../../hooks/useScheduleOperation'
import {useSchedulePublishingUpsell} from '../../../tool/contexts/SchedulePublishingUpsellProvider'
import {NewScheduleInfo} from './NewScheduleInfo'
import Schedules from './Schedules'

const debug = debugWithName('ScheduleAction')

/*
 * NOTE: Document actions are re-run whenever `onComplete` is called.
 *
 * The `onComplete` callback prop is used to typically denote that an action is 'finished',
 * and default behavior means that `useEffect` and other hooks are immediately re-run upon 'completion'.
 *
 * This particular custom action has a hook that polls an endpoint (`usePollSchedules`) and any
 * triggered `onComplete` action (typically done when a dialog is closed) will automatically query
 * this endpoint by virtue of the hook re-running and in turn, revalidate our data.
 *
 * In this case, this is exactly what we want (we want to revalidate once a schedule has been created,
 * updated or deleted) - just be mindful that any hooks here can and will run multiple times, even with
 * empty dependency arrays.
 */

/**
 * @deprecated we will be dropping support for scheduled publishing on a future major version
 * @beta
 */
export const ScheduleAction: DocumentActionComponent = (props: DocumentActionProps) => {
  const {draft, id, liveEdit, onComplete, published, type} = props
  const timeZoneScope = SCHEDULED_PUBLISHING_TIME_ZONE_SCOPE

  const currentUser = useCurrentUser()
  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id,
    type,
    permission: 'publish',
  })
  const {createSchedule} = useScheduleOperation()
  const {enabled, mode} = useScheduledPublishingEnabled()
  const {handleOpenDialog} = useSchedulePublishingUpsell()
  // Check if the current project supports Scheduled Publishing

  const [dialogOpen, setDialogOpen] = useState(false)
  const {formData, onFormChange} = useScheduleForm()

  // Poll for document schedules
  const {
    error: fetchError,
    isInitialLoading,
    schedules,
  } = usePollSchedules({
    documentId: id,
    state: 'scheduled',
  })

  debug('schedules', schedules)

  const hasExistingSchedules = schedules && schedules.length > 0

  // Check to see if the document 'exists' (has either been published OR has draft content).
  // When creating a new document, despite having an ID assigned it won't exist in your dataset
  // until the document has been edited / dirtied in any way.
  const documentExists = draft !== null || published !== null

  const insufficientPermissions = !isPermissionsLoading && !permissions?.granted

  // Callbacks
  const handleDialogOpen = useCallback(() => {
    if (mode === 'upsell') {
      handleOpenDialog('document_action')
    } else {
      setDialogOpen(true)
    }
  }, [mode, handleOpenDialog])

  const handleScheduleCreate = useCallback(() => {
    if (!formData?.date) {
      return
    }

    // Create schedule then close dialog
    createSchedule({date: formData.date, documentId: id}).then(onComplete)
  }, [onComplete, createSchedule, id, formData?.date])

  const title = hasExistingSchedules ? 'Edit Schedule' : 'Schedule'

  if (insufficientPermissions) {
    return {
      disabled: true,
      icon: CalendarIcon,
      label: title,
      title: <InsufficientPermissionsMessage currentUser={currentUser} context="edit-schedules" />,
    }
  }

  let tooltip: string | null = `This document doesn't exist yet`
  if (documentExists) {
    tooltip = null
  }
  if (isInitialLoading) {
    tooltip = 'Loading schedules'
  }
  if (liveEdit) {
    tooltip =
      'Live Edit is enabled for this content type and publishing happens automatically as you make changes'
  }

  const dialog: DocumentActionDialogProps = {
    content: fetchError ? (
      <ErrorCallout
        description="More information in the developer console."
        title="Something went wrong, unable to retrieve schedules."
      />
    ) : (
      <DocumentActionPropsProvider value={props}>
        {hasExistingSchedules ? (
          <Schedules schedules={schedules} />
        ) : (
          <EditScheduleForm onChange={onFormChange} value={formData}>
            <NewScheduleInfo id={id} schemaType={type} />
          </EditScheduleForm>
        )}
      </DocumentActionPropsProvider>
    ),
    footer: !hasExistingSchedules && (
      <DialogFooter
        buttonText="Schedule"
        disabled={!formData?.date}
        icon={ClockIcon}
        onAction={handleScheduleCreate}
        onComplete={onComplete}
        tone="primary"
      />
    ),
    header: <DialogHeader timeZoneScope={timeZoneScope} title={title} />,
    onClose: onComplete,
    type: 'dialog',
  }

  if (!enabled) return null
  return {
    dialog: dialogOpen && dialog,
    disabled: isInitialLoading || !documentExists || liveEdit,
    label: title,
    icon: CalendarIcon,
    onHandle: handleDialogOpen,
    title: tooltip && (
      <Box style={{maxWidth: '315px'}}>
        <Text size={1}>{tooltip}</Text>
      </Box>
    ),
  }
}

ScheduleAction.action = 'schedule'
