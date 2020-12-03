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
    // todo: deal with focus on offset change
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

  return (
    <Calendar
      {...rest}
      {...dayzedData}
      ref={ref}
      offset={offset}
      selectedDate={value || new Date()}
      onSelect={onChange}
      focusedDate={focusedDate}
      onFocusedDateChange={handleFocusedDayChange}
    />
  )
})
