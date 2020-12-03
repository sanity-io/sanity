import {useDayzed} from 'dayzed'
import {differenceInCalendarMonths} from 'date-fns'

import React from 'react'
import {Calendar} from './Calendar'

export const DatePicker = React.forwardRef(function DatePicker(
  props: Omit<React.ComponentProps<'div'>, 'onChange'> & {
    value: Date | null
    onChange: (nextDate: Date | null) => void
    selectTime?: boolean
  },
  ref: React.ForwardedRef<HTMLElement>
) {
  const {value, onChange, ...rest} = props
  const [offset, setOffset] = React.useState(0)
  const [focusedDate, setFocusedDate] = React.useState(new Date())

  const dayzedData = useDayzed({
    showOutsideDays: true,
    selected: value || focusedDate,
    onDateSelected: (event) => {
      onChange(event.date)
      setFocusedDate(event.date)
    },
    onOffsetChanged: setOffset,
    offset,
  })

  const handleFocusedDayChange = React.useCallback(
    (nextFocusedDate) => {
      const diff = differenceInCalendarMonths(nextFocusedDate, focusedDate)
      setFocusedDate(nextFocusedDate)
      if (diff !== 0) {
        setOffset(offset + diff)
      }
    },
    [focusedDate, offset]
  )

  const handleSelect = React.useCallback(
    (nextDate) => {
      onChange(nextDate)
      handleFocusedDayChange(nextDate)
    },
    [onChange, handleFocusedDayChange]
  )

  return (
    <Calendar
      {...rest}
      {...dayzedData}
      ref={ref}
      selectedDate={value || new Date()}
      onSelect={handleSelect}
      focusedDate={focusedDate}
      onFocusedDateChange={handleFocusedDayChange}
    />
  )
})
