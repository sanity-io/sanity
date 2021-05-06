import React, {useCallback} from 'react'

import {format, parse} from '@sanity/util/legacyDateFormat'
import PatchEvent, {set, unset} from '../../PatchEvent'
import {CommonDateTimeInput} from './CommonDateTimeInput'
import {CommonProps, ParseResult} from './types'
import {isValidDate} from './utils'

type ParsedOptions = {
  dateFormat: string
  timeFormat: string
  timeStep: number
  calendarTodayLabel: string
}
type SchemaOptions = {
  dateFormat?: string
  timeFormat?: string
  timeStep?: number
  calendarTodayLabel?: string
}
const DEFAULT_DATE_FORMAT = 'YYYY-MM-DD'
const DEFAULT_TIME_FORMAT = 'HH:mm'

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
    timeFormat: options.timeFormat || DEFAULT_TIME_FORMAT,
    timeStep: ('timeStep' in options && Number(options.timeStep)) || 1,
    calendarTodayLabel: options.calendarTodayLabel || 'Today',
  }
}

function serialize(date: Date) {
  return date.toISOString()
}

function deserialize(isoString: string): ParseResult {
  const deserialized = new Date(isoString)
  if (isValidDate(deserialized)) {
    return {isValid: true, date: deserialized}
  }
  return {isValid: false, error: `Invalid date value: "${isoString}"`}
}

export const DateTimeInput = React.forwardRef(function DateTimeInput(
  props: Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
) {
  const {type, onChange, ...rest} = props
  const {title, description, placeholder} = type

  const {dateFormat, timeFormat, timeStep} = parseOptions(type.options)

  const handleChange = useCallback(
    (nextDate: string | null) => {
      onChange(PatchEvent.from([nextDate === null ? unset() : set(nextDate)]))
    },
    [onChange]
  )

  const formatInputValue = React.useCallback(
    (date: Date) => format(date, `${dateFormat} ${timeFormat}`),
    [dateFormat, timeFormat]
  )

  const parseInputValue = React.useCallback(
    (inputValue: string) => parse(inputValue, `${dateFormat} ${timeFormat}`),
    [dateFormat, timeFormat]
  )

  return (
    <CommonDateTimeInput
      {...rest}
      onChange={handleChange}
      ref={forwardedRef}
      selectTime
      timeStep={timeStep}
      title={title}
      description={description}
      placeholder={placeholder}
      serialize={serialize}
      deserialize={deserialize}
      formatInputValue={formatInputValue}
      parseInputValue={parseInputValue}
    />
  )
})
