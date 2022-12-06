import React from 'react'
import {useSearchState} from '../../../../../../contexts/search/useSearchState'
import {Calendar} from './calendar/Calendar'
import {DatePickerProvider} from './contexts/DatePickerProvider'

export const DatePicker = React.forwardRef(function DatePicker(
  props: Omit<React.ComponentProps<'div'>, 'onChange'> & {
    value?: Date
    onChange: (nextDate: Date) => void
    selectTime?: boolean
    timeStep?: number
  },
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const {value = new Date(), onChange, ...rest} = props
  const [focusedDate, setFocusedDay] = React.useState<Date>()
  const {
    state: {fullscreen},
  } = useSearchState()

  const handleSelect = React.useCallback(
    (nextDate: any) => {
      onChange(nextDate)
      setFocusedDay(undefined)
    },
    [onChange]
  )

  return (
    <DatePickerProvider fontSize={fullscreen ? 2 : 1}>
      <Calendar
        {...rest}
        ref={ref}
        selectedDate={value}
        onSelect={handleSelect}
        focusedDate={focusedDate || value}
        onFocusedDateChange={setFocusedDay}
      />
    </DatePickerProvider>
  )
})
