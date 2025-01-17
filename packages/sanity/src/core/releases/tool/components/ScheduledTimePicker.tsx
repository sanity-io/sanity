import {format, isValid} from 'date-fns'
import {useCallback, useState} from 'react'

import {MONTH_PICKER_VARIANT} from '../../../../ui-components/inputs/DateInputs/calendar/Calendar'
import {DatePicker} from '../../../../ui-components/inputs/DateInputs/DatePicker'
import {LazyTextInput} from '../../../../ui-components/inputs/DateInputs/LazyTextInput'

type ScheduledTimePickerProps = {
  initialValue?: Date
  onChange: (date: string) => void
}

export const ScheduledTimePicker: React.FC<ScheduledTimePickerProps> = ({
  initialValue,
  onChange,
}) => {
  const [inputValue, setInputValue] = useState<Date | undefined>(initialValue)

  const handleInputChange = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    const parsedDate = new Date(event.currentTarget.value)

    if (isValid(parsedDate)) {
      setInputValue(parsedDate)

      onChange(parsedDate.toISOString())
    }
  }, [])

  return (
    <>
      <LazyTextInput
        value={inputValue ? format(inputValue, 'PPp') : undefined}
        onChange={handleInputChange}
        readOnly
      />

      <DatePicker
        ref={datePickerRef}
        monthPickerVariant={MONTH_PICKER_VARIANT.carousel}
        calendarLabels={calendarLabels}
        selectTime
        padding={0}
        value={inputValue}
        onChange={handleBundlePublishAtChange}
        showTimezone
      />
    </>
  )
}
