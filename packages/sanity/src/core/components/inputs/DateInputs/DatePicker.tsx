import {type Space} from '@sanity/ui/theme'
import {type ComponentProps, type ForwardedRef, forwardRef, useCallback, useState} from 'react'

import {type TimeZoneScope} from '../../../hooks/useTimeZone'
import {Calendar, type CalendarProps} from './calendar/Calendar'
import {type CalendarLabels} from './calendar/types'

export const DatePicker = forwardRef(function DatePicker(
  props: Omit<ComponentProps<'div'>, 'onChange'> & {
    value?: Date
    onChange: (nextDate: Date) => void
    selectTime?: boolean
    timeStep?: number
    calendarLabels: CalendarLabels
    monthPickerVariant?: CalendarProps['monthPickerVariant']
    padding?: Space
    showTimezone?: boolean
    isPastDisabled?: boolean
    timeZoneScope: TimeZoneScope
  },
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {
    value = new Date(),
    onChange,
    calendarLabels,
    padding = 2,
    // @ts-expect-error - TODO: Fix this.
    showTimeZone = false,
    timeZoneScope,
    ...rest
  } = props
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
      labels={calendarLabels}
      ref={ref}
      selectedDate={value}
      onSelect={handleSelect}
      focusedDate={focusedDate || value}
      onFocusedDateChange={setFocusedDay}
      padding={padding}
      showTimeZone={showTimeZone}
      timeZoneScope={timeZoneScope}
    />
  )
})
