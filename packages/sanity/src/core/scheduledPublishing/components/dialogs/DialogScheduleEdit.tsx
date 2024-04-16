import {
  Box,
  // eslint-disable-next-line no-restricted-imports
  Dialog,
} from '@sanity/ui'
import {useCallback} from 'react'

import useScheduleForm from '../../hooks/useScheduleForm'
import useScheduleOperation from '../../hooks/useScheduleOperation'
import {type Schedule} from '../../types'
import {EditScheduleForm} from '../editScheduleForm/EditScheduleForm'
import DialogFooter from './DialogFooter'
import DialogHeader from './DialogHeader'

export interface DialogScheduleEditProps {
  onClose: () => void
  schedule: Schedule
}

const DialogScheduleEdit = (props: DialogScheduleEditProps) => {
  const {onClose, schedule} = props

  const {updateSchedule} = useScheduleOperation()
  const {formData, isDirty, onFormChange} = useScheduleForm(schedule)

  // Callbacks
  const handleScheduleUpdate = useCallback(() => {
    if (!formData?.date) {
      return
    }
    // Update schedule then close self
    updateSchedule({
      date: formData.date,
      scheduleId: schedule.id,
    }).then(onClose)
  }, [schedule.id, updateSchedule, onClose, formData?.date])

  return (
    <Dialog
      footer={
        <Box paddingX={4} paddingY={3}>
          <DialogFooter
            buttonText="Update"
            disabled={!isDirty}
            onAction={handleScheduleUpdate}
            onComplete={onClose}
            tone="primary"
          />
        </Box>
      }
      header={<DialogHeader title="Edit schedule" />}
      id="time-zone"
      onClose={onClose}
      width={1}
    >
      <Box padding={4}>
        <EditScheduleForm onChange={onFormChange} value={formData} />
      </Box>
    </Dialog>
  )
}

export default DialogScheduleEdit
