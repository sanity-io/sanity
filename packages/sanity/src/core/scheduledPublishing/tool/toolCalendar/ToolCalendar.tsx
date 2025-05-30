import {useCallback, useState} from 'react'

import {CalendarFilter} from '../../../components/inputs/DateFilters/calendar'
import {type TimeZoneScope, useTimeZone} from '../../../hooks/useTimeZone'
import {CalendarDay} from './CalendarDay'

export interface ToolCalendarProps {
  onSelect: (date?: Date) => void
  selectedDate?: Date
  timeZoneScope: TimeZoneScope
}

export const ToolCalendar = (props: ToolCalendarProps) => {
  const {onSelect, selectedDate, timeZoneScope} = props

  const {getCurrentZoneDate, utcToCurrentZoneDate} = useTimeZone(timeZoneScope)

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
      timeZoneScope={timeZoneScope}
    />
  )
}
