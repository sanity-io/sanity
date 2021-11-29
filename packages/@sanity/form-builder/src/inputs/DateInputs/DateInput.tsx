import React, {useCallback} from 'react'
import {format, parse} from '@sanity/util/legacyDateFormat'
import PatchEvent, {set, unset} from '../../PatchEvent'

import {CommonDateTimeInput} from './CommonDateTimeInput'
import type {CommonProps} from './types'

type ParsedOptions = {
  dateFormat: string
  calendarTodayLabel: string
}
type SchemaOptions = {
  dateFormat?: string
  calendarTodayLabel?: string
}

// This is the format dates are stored on
const VALUE_FORMAT = 'YYYY-MM-DD'
// default to how they are stored
const DEFAULT_DATE_FORMAT = VALUE_FORMAT

export type Props = CommonProps & {
  onChange: (event: PatchEvent) => void
  type: {
    name: string
    title: string
    description?: string
    options?: SchemaOptions
    placeholder?: string
  }
}

function parseOptions(options: SchemaOptions = {}): ParsedOptions {
  return {
    dateFormat: options.dateFormat || DEFAULT_DATE_FORMAT,
    calendarTodayLabel: options.calendarTodayLabel || 'Today',
  }
}

const deserialize = (value: string) => parse(value, VALUE_FORMAT)
const serialize = (date: Date) => format(date, VALUE_FORMAT)

export const DateInput = React.forwardRef(function DateInput(
  props: Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
) {
  const {type, onChange, ...rest} = props
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
      {...rest}
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
