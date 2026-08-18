import {type ComponentProps, useCallback, useState, type RefAttributes} from 'react'

import {type TimeZoneScope, useTimeZone} from '../../../../hooks/useTimeZone'
import {Calendar} from './calendar/Calendar'

export function DatePicker(
  props: Omit<ComponentProps<'div'>, 'onChange'> & {
    value?: Date
    onChange: (nextDate: Date) => void
    selectTime?: boolean
    timeStep?: number
    customValidation?: (selectedDate: Date) => boolean
    timeZoneScope: TimeZoneScope
  } & RefAttributes<HTMLDivElement>,
) {
  const {ref, value: _value, onChange, customValidation, timeZoneScope, ...rest} = props
  const value = _value ?? new Date()
  const {utcToCurrentZoneDate} = useTimeZone(timeZoneScope)
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
      timeZoneScope={timeZoneScope}
    />
  )
}
