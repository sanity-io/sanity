import {useCallback, useState} from 'react'

import {type Schedule, type ScheduleFormData} from '../types'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default function useScheduleForm(schedule?: Schedule) {
  const [isDirty, setIsDirty] = useState(false)
  const [formData, setFormData] = useState<ScheduleFormData | null>(
    schedule && schedule?.executeAt
      ? {
          date: schedule.executeAt,
        }
      : null,
  )

  const handleFormChange = useCallback(
    (form: ScheduleFormData) => {
      const equalDates =
        schedule?.executeAt &&
        new Date(schedule.executeAt).getTime() === new Date(form?.date).getTime()

      setFormData(form)
      setIsDirty(!equalDates)
    },
    [schedule?.executeAt],
  )

  return {
    formData,
    isDirty,
    onFormChange: handleFormChange,
  }
}
