import {Stack} from '@sanity/ui'
import React, {useCallback} from 'react'
import {useSearchState} from '../../../../../contexts/search/useSearchState'
import type {OperatorInputComponentProps} from '../../../../../definitions/operators/operatorTypes'
import {DatePicker} from './datePicker/DatePicker'
import {ParsedDateTextInput} from './ParsedDateTextInput'

export function CommonDateInput({
  onChange,
  selectTime,
  value,
}: OperatorInputComponentProps<string> & {
  selectTime?: boolean
}) {
  const {
    state: {fullscreen},
  } = useSearchState()

  const handleDatePickerChange = useCallback(
    ({date}: {date?: Date | null}) => {
      const timestamp = date?.toISOString()
      if (timestamp) {
        onChange(timestamp)
      }
    },
    [onChange]
  )

  return (
    <Stack space={3}>
      <ParsedDateTextInput
        aria-label="Date"
        fontSize={fullscreen ? 2 : 1}
        onChange={onChange}
        selectTime={selectTime}
        value={value}
      />
      <DatePicker
        date={value ? new Date(value) : undefined}
        onChange={handleDatePickerChange}
        selectTime={selectTime}
      />
    </Stack>
  )
}
