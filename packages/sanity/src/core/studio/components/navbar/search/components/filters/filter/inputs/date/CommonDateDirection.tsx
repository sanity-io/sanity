import {Stack} from '@sanity/ui'
import React, {useCallback, useMemo} from 'react'
import {useSearchState} from '../../../../../contexts/search/useSearchState'
import type {OperatorDateDirectionValue} from '../../../../../definitions/operators/dateOperators'
import type {OperatorInputComponentProps} from '../../../../../definitions/operators/operatorTypes'
import {DateIncludeTimeFooter} from './dateIncludeTimeFooter/DateIncludeTimeFooter'
import {DatePicker} from './datePicker/DatePicker'
import {ParsedDateTextInput} from './ParsedDateTextInput'
import {getDateISOString} from './utils/getDateISOString'

export function CommonDateDirectionInput({
  direction,
  isDateTime,
  onChange,
  value,
}: OperatorInputComponentProps<OperatorDateDirectionValue> & {
  direction: 'after' | 'before'
  isDateTime?: boolean
}) {
  const {
    state: {fullscreen},
  } = useSearchState()

  const roundDay = useMemo(() => {
    switch (direction) {
      case 'after':
        return 'end'
      case 'before':
        return 'start'
      default:
        return undefined
    }
  }, [direction])

  const handleDatePickerChange = useCallback(
    ({date}: {date?: Date | null}) => {
      let dateISOString: string | null = null
      if (date) {
        dateISOString = getDateISOString({
          date,
          dateOnly: !isDateTime,
          roundDay: value?.includeTime ? undefined : roundDay,
        })
      }
      onChange({
        includeTime: value?.includeTime,
        value: dateISOString,
      })
    },
    [isDateTime, onChange, roundDay, value?.includeTime]
  )

  const handleIncludeTimeChange = useCallback(() => {
    const includeTime = !value?.includeTime
    const date = value?.value ? new Date(value.value) : null

    let dateISOString: string | null = null
    if (date) {
      dateISOString = getDateISOString({
        date,
        dateOnly: !isDateTime,
        roundDay: includeTime ? 'start' : roundDay,
      })
    }
    onChange({includeTime, value: dateISOString})
  }, [isDateTime, onChange, roundDay, value])

  const handleTextDateChange = useCallback(
    (date: string | null) => {
      onChange({
        includeTime: value?.includeTime,
        value: date || null,
      })
    },
    [onChange, value]
  )

  return (
    <Stack space={3}>
      <ParsedDateTextInput
        aria-label="Date"
        fontSize={fullscreen ? 2 : 1}
        onChange={handleTextDateChange}
        selectTime={isDateTime && value?.includeTime}
        value={value?.value}
      />
      <DatePicker
        date={value?.value ? new Date(value.value) : undefined}
        onChange={handleDatePickerChange}
        selectTime={isDateTime}
      />
      {/* Include time footer */}
      {isDateTime && (
        <DateIncludeTimeFooter onChange={handleIncludeTimeChange} value={!!value?.includeTime} />
      )}
    </Stack>
  )
}
