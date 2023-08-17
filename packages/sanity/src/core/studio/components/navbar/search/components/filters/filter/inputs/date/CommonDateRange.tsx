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

const PLACEHOLDER_START_DATE_OFFSET = -7 // days

export function CommonDateRangeInput({
  isDateTime,
  onChange,
  value,
}: OperatorInputComponentProps<OperatorDateRangeValue> & {
  isDateTime: boolean
}) {
  const {
    state: {fullscreen},
  } = useSearchState()

  /**
   * For placeholder values: Use the current date for the end date input, and an arbitrary date
   * in the past (e.g. -7 days from now) for the start date input.
   */
  const placeholderStartDate = useMemo(() => addDays(new Date(), PLACEHOLDER_START_DATE_OFFSET), [])
  const placeholderEndDate = useMemo(() => new Date(), [])

  const handleDatePickerChange = useCallback(
    ({date, endDate}: {date?: Date | null; endDate?: Date | null}) => {
      onChange(
        getStartAndEndDate({
          date,
          endDate,
          includeTime: value?.includeTime,
          isDateTime,
        }),
      )
    },
    [isDateTime, onChange, value?.includeTime],
  )

  const handleIncludeTimeChange = useCallback(() => {
    const includeTime = !value?.includeTime
    onChange(
      getStartAndEndDate({
        date: value?.dateMin ? new Date(value.dateMin) : null,
        endDate: value?.dateMax ? new Date(value.dateMax) : null,
        includeTime,
        isDateTime,
      }),
    )
  }, [isDateTime, onChange, value])

  const handleTextEndDateChange = useCallback(
    (date: string | null) => {
      onChange({
        includeTime: value?.includeTime,
        dateMax: date || null,
        dateMin: value?.dateMin || null,
      })
    },
    [onChange, value],
  )

  const handleTextStartDateChange = useCallback(
    (date: string | null) => {
      onChange({
        includeTime: value?.includeTime,
        dateMax: value?.dateMax || null,
        dateMin: date || null,
      })
    },
    [onChange, value],
  )

  return (
    <div>
      <Stack space={3}>
        <Flex direction="column" gap={3}>
          {/* Start date */}
          <ParsedDateTextInput
            aria-label="Start date"
            fontSize={fullscreen ? 2 : 1}
            isDateTime={isDateTime}
            isDateTimeFormat={isDateTime && value?.includeTime}
            onChange={handleTextStartDateChange}
            placeholderDate={placeholderStartDate}
            radius={2}
            value={value?.dateMin}
          />
          {/* End date */}
          <ParsedDateTextInput
            aria-label="End date"
            fontSize={fullscreen ? 2 : 1}
            isDateTime={isDateTime}
            isDateTimeFormat={isDateTime && value?.includeTime}
            onChange={handleTextEndDateChange}
            placeholderDate={placeholderEndDate}
            radius={2}
            value={value?.dateMax}
          />
        </Flex>
        <DatePicker
          date={value?.dateMin ? new Date(value.dateMin) : undefined}
          endDate={value?.dateMax ? new Date(value.dateMax) : undefined}
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
}): {
  includeTime?: boolean
  dateMax: string | null
  dateMin: string | null
} {
  if (includeTime) {
    return {
      includeTime,
      dateMax: endDate
        ? getDateISOString({date: endDate, dateOnly: !isDateTime, roundDay: 'start'})
        : null,
      dateMin: date
        ? getDateISOString({date: date, dateOnly: !isDateTime, roundDay: 'start'})
        : null,
    }
  }

  return {
    includeTime,
    dateMax: endDate
      ? getDateISOString({date: endDate, dateOnly: !isDateTime, roundDay: 'end'})
      : null,
    dateMin: date ? getDateISOString({date, dateOnly: !isDateTime, roundDay: 'start'}) : null,
  }
}
