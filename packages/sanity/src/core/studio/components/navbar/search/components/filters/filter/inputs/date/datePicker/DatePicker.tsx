import React, {useCallback} from 'react'
import {Calendar} from './calendar/Calendar'

interface DatePickerProps {
  date?: Date
  endDate?: Date
  onChange: ({date, endDate}: {date?: Date | null; endDate?: Date | null}) => void
  selectRange?: boolean
  selectTime?: boolean
}

export function DatePicker({date, endDate, onChange, selectRange, selectTime}: DatePickerProps) {
  const handleSelect = useCallback(
    (dates: {date: Date | null; endDate?: Date | null}) => {
      onChange(dates)
    },
    [onChange],
  )

  return (
    <Calendar
      date={date}
      endDate={endDate}
      onSelect={handleSelect}
      selectRange={selectRange}
      selectTime={selectTime}
    />
  )
}
