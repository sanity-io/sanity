import {useState} from 'react'

import {type Schedule, type ScheduleFormData} from '../types'

export default function useScheduleForm(schedule?: Schedule) {
  const [isDirty, setIsDirty] = useState(false)
  const [formData, setFormData] = useState<ScheduleFormData | null>(
    schedule && schedule?.executeAt
      ? {
          date: schedule.executeAt,
        }
      : null,
  )

  const handleFormChange = (form: ScheduleFormData) => {
    const equalDates =
      schedule?.executeAt &&
      new Date(schedule.executeAt).getTime() === new Date(form?.date).getTime()

    setFormData(form)
    setIsDirty(!equalDates)
  }

  return {
    formData,
    isDirty,
    onFormChange: handleFormChange,
  }
}
