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
  value,
}: OperatorInputComponentProps<string> & {
  isDateTime?: boolean
}) {
  const {
    state: {fullscreen},
  } = useSearchState()

  const handleDatePickerChange = useCallback(
    ({date}: {date?: Date | null}) => {
      const timestamp = getDateISOString({date, isDateTime})
      if (timestamp) {
        onChange(timestamp)
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
        useDateFormat={false}
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
