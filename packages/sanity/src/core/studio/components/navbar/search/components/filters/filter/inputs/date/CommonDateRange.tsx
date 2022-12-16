import {Flex, Stack} from '@sanity/ui'
import React, {useCallback} from 'react'
import {useSearchState} from '../../../../../contexts/search/useSearchState'
import type {OperatorDateRangeValue} from '../../../../../definitions/operators/dateOperators'
import type {OperatorInputComponentProps} from '../../../../../definitions/operators/operatorTypes'
import {DatePicker} from './datePicker/DatePicker'
import {ParsedDateTextInput} from './ParsedDateTextInput'

export function CommonDateRangeInput({
  onChange,
  selectTime,
  value,
}: OperatorInputComponentProps<OperatorDateRangeValue> & {
  selectTime?: boolean
}) {
  const {
    state: {fullscreen},
  } = useSearchState()

  const handleDatePickerChange = useCallback(
    ({date, endDate}: {date?: Date | null; endDate?: Date | null}) => {
      onChange({
        max: endDate ? endDate?.toISOString() || null : null,
        min: date ? date?.toISOString() || null : null,
      })
    },
    [onChange]
  )

  const handleEndDateChange = useCallback(
    (date: string | null) => {
      onChange({
        max: date || null,
        min: value?.min || null,
      })
    },
    [onChange, value]
  )

  const handleStartDateChange = useCallback(
    (date: string | null) => {
      onChange({
        max: value?.max || null,
        min: date || null,
      })
    },
    [onChange, value]
  )

  return (
    <div>
      <Stack space={3}>
        <Flex direction="column" gap={3}>
          {/* Start date */}
          <ParsedDateTextInput
            aria-label="Start date"
            fontSize={fullscreen ? 2 : 1}
            onChange={handleStartDateChange}
            placeholder="Start date"
            selectTime={selectTime}
            value={value?.min}
          />
          {/* End date */}
          <ParsedDateTextInput
            aria-label="End date"
            fontSize={fullscreen ? 2 : 1}
            onChange={handleEndDateChange}
            placeholder="End date"
            selectTime={selectTime}
            value={value?.max}
          />
        </Flex>

        <DatePicker
          date={value?.min ? new Date(value.min) : undefined}
          endDate={value?.max ? new Date(value.max) : undefined}
          onChange={handleDatePickerChange}
          selectRange
          selectTime={selectTime}
        />
      </Stack>
    </div>
  )
}
