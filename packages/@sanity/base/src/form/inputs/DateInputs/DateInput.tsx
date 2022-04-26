import React, {useCallback} from 'react'
import {format, parse} from '@sanity/util/legacyDateFormat'
import {set, unset} from '../../patch'
import {StringInputProps} from '../../types'
import {CommonDateTimeInput} from './CommonDateTimeInput'

interface ParsedOptions {
  dateFormat: string
  calendarTodayLabel: string
}

interface SchemaOptions {
  dateFormat?: string
  calendarTodayLabel?: string
}

export type DateInputProps = StringInputProps

// This is the format dates are stored on
const VALUE_FORMAT = 'YYYY-MM-DD'
// default to how they are stored
const DEFAULT_DATE_FORMAT = VALUE_FORMAT

function parseOptions(options: SchemaOptions = {}): ParsedOptions {
  return {
    dateFormat: options.dateFormat || DEFAULT_DATE_FORMAT,
    calendarTodayLabel: options.calendarTodayLabel || 'Today',
  }
}

const deserialize = (value: string) => parse(value, VALUE_FORMAT)
const serialize = (date: Date) => format(date, VALUE_FORMAT)

export function DateInput(props: DateInputProps) {
  const {inputProps, level, onChange, presence, type, validation, value} = props
  const {id, readOnly, ref} = inputProps
  const {dateFormat} = parseOptions(type.options)

  const handleChange = useCallback(
    (nextDate: string | null) => {
      onChange(nextDate === null ? unset() : set(nextDate))
    },
    [onChange]
  )

  const formatInputValue = useCallback((date: Date) => format(date, dateFormat), [dateFormat])

  const parseInputValue = useCallback(
    (inputValue: string) => parse(inputValue, dateFormat),
    [dateFormat]
  )

  return (
    <CommonDateTimeInput
      description={type.description}
      deserialize={deserialize}
      formatInputValue={formatInputValue}
      id={id}
      level={level}
      onChange={handleChange}
      parseInputValue={parseInputValue}
      placeholder={type.placeholder}
      presence={presence}
      readOnly={readOnly}
      ref={ref}
      selectTime={false}
      serialize={serialize}
      title={type.title}
      validation={validation}
      value={value}
    />
  )
}
