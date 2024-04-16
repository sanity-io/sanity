import {type ComponentProps, type ForwardedRef, forwardRef, useCallback, useState} from 'react'

import useTimeZone from '../../../hooks/useTimeZone'
import {Calendar} from './calendar/Calendar'

export const DatePicker = forwardRef(function DatePicker(
  props: Omit<ComponentProps<'div'>, 'onChange'> & {
    value?: Date
    onChange: (nextDate: Date) => void
    selectTime?: boolean
    timeStep?: number
    customValidation?: (selectedDate: Date) => boolean
  },
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {utcToCurrentZoneDate} = useTimeZone()
  const {value = new Date(), onChange, customValidation, ...rest} = props
  const [focusedDate, setFocusedDay] = useState<Date>()

  const handleSelect = useCallback(
    (nextDate: Date) => {
      onChange(nextDate)
      setFocusedDay(undefined)
    },
    [onChange],
  )

  return (
    <Calendar
      {...rest}
      ref={ref}
      selectedDate={utcToCurrentZoneDate(value)}
      onSelect={handleSelect}
      focusedDate={utcToCurrentZoneDate(focusedDate || value)}
      onFocusedDateChange={setFocusedDay}
      customValidation={customValidation}
    />
  )
})
