import React, {useCallback} from 'react'
import {format, parse} from '@sanity/util/legacyDateFormat'
import {PatchEvent, set, unset} from '../../patch'
import {StringFieldProps} from '../../types'
import {CommonDateTimeInput} from './CommonDateTimeInput'

interface ParsedOptions {
  dateFormat: string
  calendarTodayLabel: string
}

interface SchemaOptions {
  dateFormat?: string
  calendarTodayLabel?: string
}

export type DateInputProps = StringFieldProps

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

export const DateInput = React.forwardRef(function DateInput(
  props: DateInputProps,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
) {
  const {type, onChange, ...restProps} = props
  const {title, description, placeholder} = type

  const {dateFormat} = parseOptions(type.options)

  const handleChange = useCallback(
    (nextDate: string | null) => {
      onChange(PatchEvent.from([nextDate === null ? unset() : set(nextDate)]))
    },
    [onChange]
  )

  const formatInputValue = React.useCallback((date: Date) => format(date, dateFormat), [dateFormat])

  const parseInputValue = React.useCallback((inputValue: string) => parse(inputValue, dateFormat), [
    dateFormat,
  ])

  return (
    <CommonDateTimeInput
      {...restProps}
      onChange={handleChange}
      ref={forwardedRef}
      selectTime={false}
      title={title}
      description={description}
      placeholder={placeholder}
      parseInputValue={parseInputValue}
      formatInputValue={formatInputValue}
      deserialize={deserialize}
      serialize={serialize}
    />
  )
})
