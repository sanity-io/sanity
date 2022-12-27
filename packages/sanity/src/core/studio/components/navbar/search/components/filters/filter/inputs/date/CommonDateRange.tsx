import {Flex, Stack, Switch, Text} from '@sanity/ui'
import {addDays, endOfDay, startOfDay} from 'date-fns'
import React, {useCallback, useMemo} from 'react'
import {useSearchState} from '../../../../../contexts/search/useSearchState'
import type {OperatorDateRangeValue} from '../../../../../definitions/operators/dateOperators'
import type {OperatorInputComponentProps} from '../../../../../definitions/operators/operatorTypes'
import {DatePicker} from './datePicker/DatePicker'
import {ParsedDateTextInput} from './ParsedDateTextInput'

const INCLUDE_TIME_LABEL = 'Include time'

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

  const placeholderStartDate = useMemo(() => addDays(new Date(), -7), [])
  const placeholderEndDate = useMemo(() => new Date(), [])

  const handleDatePickerChange = useCallback(
    ({date, endDate}: {date?: Date | null; endDate?: Date | null}) => {
      onChange(getStartAndEndDate({date, endDate, includeTime: value?.includeTime}))
    },
    [onChange, value?.includeTime]
  )

  const handleIncludeTimeChange = useCallback(() => {
    const includeTime = !value?.includeTime
    onChange(
      getStartAndEndDate({
        date: value?.min ? new Date(value.min) : null,
        endDate: value?.max ? new Date(value.max) : null,
        includeTime,
        resetTime: includeTime,
      })
    )
  }, [onChange, value])

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
            selectTime={selectTime && value?.includeTime}
            value={value?.min}
          />
          {/* End date */}
          <ParsedDateTextInput
            aria-label="End date"
            fontSize={fullscreen ? 2 : 1}
            onChange={handleTextEndDateChange}
            placeholderDate={placeholderEndDate}
            selectTime={selectTime && value?.includeTime}
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

        {/* Select time  */}
        {selectTime && (
          <Flex align="center" gap={2} justify="flex-end" marginTop={1}>
            <Stack>
              <Text
                muted
                onClick={handleIncludeTimeChange}
                size={1}
                style={{cursor: 'default'}}
                weight="medium"
              >
                {INCLUDE_TIME_LABEL}
              </Text>
            </Stack>
            <Switch
              checked={!!value?.includeTime}
              label={INCLUDE_TIME_LABEL}
              onChange={handleIncludeTimeChange}
            />
          </Flex>
        )}
      </Stack>
    </div>
  )
}

function getStartAndEndDate({
  date,
  endDate,
  includeTime,
  resetTime,
}: {
  date?: Date | null
  endDate?: Date | null
  includeTime?: boolean
  resetTime?: boolean
}) {
  if (includeTime) {
    return {
      includeTime,
      max: getDateString({date: endDate, resetTime}),
      min: getDateString({date: date, resetTime}),
    }
  }

  return {
    includeTime,
    max: getDateString({date: endDate ? endOfDay(endDate) : null, resetTime}),
    min: getDateString({date: date ? startOfDay(date) : null, resetTime}),
  }
}

function getDateString({date, resetTime}: {date?: Date | null; resetTime?: boolean}) {
  if (!date) {
    return null
  }

  return resetTime ? startOfDay(date).toISOString() : date.toISOString()
}
