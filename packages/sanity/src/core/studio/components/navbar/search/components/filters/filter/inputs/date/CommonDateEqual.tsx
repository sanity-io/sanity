import {Stack} from '@sanity/ui'
import React, {useCallback} from 'react'
import {useSearchState} from '../../../../../contexts/search/useSearchState'
import type {OperatorDateEqualValue} from '../../../../../definitions/operators/dateOperators'
import type {OperatorInputComponentProps} from '../../../../../definitions/operators/operatorTypes'
import {DateIncludeTimeFooter} from './dateIncludeTimeFooter/DateIncludeTimeFooter'
import {DatePicker} from './datePicker/DatePicker'
import {ParsedDateTextInput} from './ParsedDateTextInput'
import {getDateISOString} from './utils/getDateISOString'

export function CommonDateEqualInput({
  isDateTime,
  onChange,
  value,
}: OperatorInputComponentProps<OperatorDateEqualValue> & {
  isDateTime: boolean
}) {
  const {
    state: {fullscreen},
  } = useSearchState()

  const handleDatePickerChange = useCallback(
    ({date}: {date?: Date | null}) => {
      if (date) {
        const dateISOString = getDateISOString({date, dateOnly: !isDateTime})
        onChange({
          includeTime: value?.includeTime,
          date: dateISOString,
        })
      } else {
        onChange(null)
      }
    },
    [isDateTime, onChange, value?.includeTime],
  )

  const handleIncludeTimeChange = useCallback(() => {
    const includeTime = !value?.includeTime
    const date = value?.date ? new Date(value.date) : null

    let dateISOString: string | null = null
    if (date) {
      dateISOString = getDateISOString({
        date,
        dateOnly: !isDateTime,
      })
    }
    onChange({includeTime, date: dateISOString})
  }, [isDateTime, onChange, value])

  const handleTextDateChange = useCallback(
    (date: string | null) => {
      onChange({
        includeTime: value?.includeTime,
        date: date || null,
      })
    },
    [onChange, value?.includeTime],
  )

  return (
    <Stack space={3}>
      <ParsedDateTextInput
        aria-label="Date"
        fontSize={fullscreen ? 2 : 1}
        isDateTime={isDateTime}
        isDateTimeFormat={isDateTime && value?.includeTime}
        onChange={handleTextDateChange}
        radius={2}
        value={value?.date}
      />
      <DatePicker
        date={value?.date ? new Date(value.date) : undefined}
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
