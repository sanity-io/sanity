import {Stack} from '@sanity/ui'
import React, {useCallback} from 'react'
import {useSearchState} from '../../../../../contexts/search/useSearchState'
import type {OperatorInputComponentProps} from '../../../../../definitions/operators/operatorTypes'
import {DatePicker} from './datePicker/DatePicker'
import {ParsedDateTextInput} from './ParsedDateTextInput'
import {getDateISOString} from './utils/getDateISOString'

export function CommonDateEqualInput({
  isDateTime,
  onChange,
  useInputDateFormat,
  value,
}: OperatorInputComponentProps<string> & {
  isDateTime?: boolean
  useInputDateFormat?: boolean
}) {
  const {
    state: {fullscreen},
  } = useSearchState()

  const handleDatePickerChange = useCallback(
    ({date}: {date?: Date | null}) => {
      if (date) {
        const timestamp = getDateISOString({date, dateOnly: !isDateTime})
        onChange(timestamp)
      } else {
        onChange(null)
      }
    },
    [isDateTime, onChange]
  )

  return (
    <Stack space={3}>
      <ParsedDateTextInput
        aria-label="Date"
        fontSize={fullscreen ? 2 : 1}
        onChange={onChange}
        selectTime={isDateTime}
        useDateFormat={useInputDateFormat}
        value={value}
      />
      <DatePicker
        date={value ? new Date(value) : undefined}
        onChange={handleDatePickerChange}
        selectTime={isDateTime}
      />
    </Stack>
  )
}
