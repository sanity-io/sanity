import React from 'react'
import {Calendar} from './calendar/Calendar'
import {CalendarLabels} from './calendar/types'

export const DatePicker = React.forwardRef(function DatePicker(
  props: Omit<React.ComponentProps<'div'>, 'onChange'> & {
    value?: Date
    onChange: (nextDate: Date) => void
    selectTime?: boolean
    timeStep?: number
    calendarLabels: CalendarLabels
  },
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const {value = new Date(), onChange, calendarLabels, ...rest} = props
  const [focusedDate, setFocusedDay] = React.useState<Date>()

  const handleSelect = React.useCallback(
    (nextDate: Date) => {
      onChange(nextDate)
      setFocusedDay(undefined)
    },
    [onChange],
  )

  return (
    <Calendar
      {...rest}
      labels={calendarLabels}
      ref={ref}
      selectedDate={value}
      onSelect={handleSelect}
      focusedDate={focusedDate || value}
      onFocusedDateChange={setFocusedDay}
    />
  )
})
