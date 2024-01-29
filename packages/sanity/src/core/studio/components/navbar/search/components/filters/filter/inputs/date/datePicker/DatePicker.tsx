import {useCallback} from 'react'
import {Calendar} from './calendar/Calendar'

interface DatePickerProps {
  date?: Date
  endDate?: Date
  initialFocusedDate?: Date
  onChange: ({date, endDate}: {date?: Date | null; endDate?: Date | null}) => void
  selectEndDate?: boolean
  selectRange?: boolean
  selectTime?: boolean
}

export function DatePicker({
  date,
  endDate,
  initialFocusedDate,
  onChange,
  selectEndDate,
  selectRange,
  selectTime,
}: DatePickerProps) {
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
      initialFocusedDate={initialFocusedDate}
      onSelect={handleSelect}
      selectEndDate={selectEndDate}
      selectRange={selectRange}
      selectTime={selectTime}
    />
  )
}
