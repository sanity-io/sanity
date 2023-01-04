import {Flex, Stack} from '@sanity/ui'
import {addDays} from 'date-fns'
import React, {useCallback, useMemo} from 'react'
import {useSearchState} from '../../../../../contexts/search/useSearchState'
import type {OperatorDateRangeValue} from '../../../../../definitions/operators/dateOperators'
import type {OperatorInputComponentProps} from '../../../../../definitions/operators/operatorTypes'
import {DateIncludeTimeFooter} from './dateIncludeTimeFooter/DateIncludeTimeFooter'
import {DatePicker} from './datePicker/DatePicker'
import {ParsedDateTextInput} from './ParsedDateTextInput'
import {getDateISOString} from './utils/getDateISOString'

export function CommonDateRangeInput({
  isDateTime,
  onChange,
  value,
}: OperatorInputComponentProps<OperatorDateRangeValue> & {
  isDateTime?: boolean
}) {
  const {
    state: {fullscreen},
  } = useSearchState()

  const placeholderStartDate = useMemo(() => addDays(new Date(), -7), [])
  const placeholderEndDate = useMemo(() => new Date(), [])

  const handleDatePickerChange = useCallback(
    ({date, endDate}: {date?: Date | null; endDate?: Date | null}) => {
      onChange(
        getStartAndEndDate({
          date, //
          endDate,
          includeTime: value?.includeTime,
          isDateTime,
        })
      )
    },
    [isDateTime, onChange, value?.includeTime]
  )

  const handleIncludeTimeChange = useCallback(() => {
    const includeTime = !value?.includeTime
    onChange(
      getStartAndEndDate({
        date: value?.min ? new Date(value.min) : null,
        endDate: value?.max ? new Date(value.max) : null,
        includeTime,
        isDateTime,
      })
    )
  }, [isDateTime, onChange, value])

  const handleTextEndDateChange = useCallback(
    (date: string | null) => {
      onChange({
        includeTime: value?.includeTime,
        max: date || null,
        min: value?.min || null,
      })
    },
    [onChange, value]
  )

  const handleTextStartDateChange = useCallback(
    (date: string | null) => {
      onChange({
        includeTime: value?.includeTime,
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
            onChange={handleTextStartDateChange}
            placeholderDate={placeholderStartDate}
            selectTime={isDateTime && value?.includeTime}
            value={value?.min}
          />
          {/* End date */}
          <ParsedDateTextInput
            aria-label="End date"
            fontSize={fullscreen ? 2 : 1}
            onChange={handleTextEndDateChange}
            placeholderDate={placeholderEndDate}
            selectTime={isDateTime && value?.includeTime}
            value={value?.max}
          />
        </Flex>

        <DatePicker
          date={value?.min ? new Date(value.min) : undefined}
          endDate={value?.max ? new Date(value.max) : undefined}
          onChange={handleDatePickerChange}
          selectRange
          selectTime={isDateTime}
        />

        {/* Include time footer */}
        {isDateTime && (
          <DateIncludeTimeFooter onChange={handleIncludeTimeChange} value={!!value?.includeTime} />
        )}
      </Stack>
    </div>
  )
}

function getStartAndEndDate({
  date,
  endDate,
  includeTime,
  isDateTime,
}: {
  date?: Date | null
  endDate?: Date | null
  includeTime?: boolean
  isDateTime?: boolean
}) {
  if (includeTime) {
    return {
      includeTime,
      max: endDate
        ? getDateISOString({date: endDate, dateOnly: !isDateTime, roundDay: 'start'})
        : null,
      min: date ? getDateISOString({date: date, dateOnly: !isDateTime, roundDay: 'start'}) : null,
    }
  }

  return {
    includeTime,
    max: endDate ? getDateISOString({date: endDate, dateOnly: !isDateTime, roundDay: 'end'}) : null,
    min: date ? getDateISOString({date, dateOnly: !isDateTime, roundDay: 'start'}) : null,
  }
}
