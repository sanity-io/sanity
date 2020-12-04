import React from 'react'
import {Calendar} from './Calendar'

export const DatePicker = React.forwardRef(function DatePicker(
  props: Omit<React.ComponentProps<'div'>, 'onChange'> & {
    value?: Date
    onChange: (nextDate?: Date) => void
    selectTime?: boolean
  },
  ref: React.ForwardedRef<HTMLElement>
) {
  const {value = new Date(), onChange, ...rest} = props
  const [focusedDate, onFocusedDayChange] = React.useState<Date>()

  const handleSelect = React.useCallback(
    (nextDate) => {
      onChange(nextDate)
      onFocusedDayChange(undefined)
    },
    [onChange]
  )

  return (
    <Calendar
      {...rest}
      ref={ref}
      selectedDate={value}
      onSelect={handleSelect}
      focusedDate={focusedDate || value}
      onFocusedDateChange={onFocusedDayChange}
    />
  )
})
