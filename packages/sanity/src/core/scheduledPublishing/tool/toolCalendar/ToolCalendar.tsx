import {useCallback, useState} from 'react'

import {CalendarFilter} from '../../../components/inputs/DateFilters/calendar/CalendarFilter'
import useTimeZone from '../../hooks/useTimeZone'
import {CalendarDay} from './CalendarDay'

export interface ToolCalendarProps {
  onSelect: (date?: Date) => void
  selectedDate?: Date
}

export const ToolCalendar = (props: ToolCalendarProps) => {
  const {onSelect, selectedDate} = props

  const {getCurrentZoneDate, utcToCurrentZoneDate} = useTimeZone()

  // Focus selected date (if routed) or user's current date (in stored time zone)
  const [focusedDate, setFocusedDate] = useState<Date>(selectedDate || getCurrentZoneDate())

  const handleFocusDateChange = useCallback(
    (date: Date) => {
      setFocusedDate(utcToCurrentZoneDate(date))
    },
    [utcToCurrentZoneDate],
  )

  return (
    <CalendarFilter
      focusedDate={focusedDate}
      onFocusedDateChange={handleFocusDateChange}
      onSelect={onSelect}
      selectedDate={selectedDate}
      renderCalendarDay={CalendarDay}
    />
  )
}
