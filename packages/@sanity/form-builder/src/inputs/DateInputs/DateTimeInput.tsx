import React, {useCallback} from 'react'
import {getMinutes, setMinutes, parseISO} from 'date-fns'
import {format, parse} from '@sanity/util/legacyDateFormat'
import {StringSchemaType} from '@sanity/types'
import {PatchEvent, set, unset, FormInputProps} from '@sanity/base/form'
import {CommonDateTimeInput} from './CommonDateTimeInput'
import {ParseResult} from './types'
import {isValidDate} from './utils'

interface ParsedOptions {
  dateFormat: string
  timeFormat: string
  timeStep: number
  calendarTodayLabel: string
}

interface SchemaOptions {
  dateFormat?: string
  timeFormat?: string
  timeStep?: number
  calendarTodayLabel?: string
}

export type DateTimeInputProps = FormInputProps<string, StringSchemaType>

const DEFAULT_DATE_FORMAT = 'YYYY-MM-DD'
const DEFAULT_TIME_FORMAT = 'HH:mm'

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

// enforceTimeStep takes a dateString and datetime schema options and enforces the time
// to be within the configured timeStep
function enforceTimeStep(dateString: string, timeStep: number) {
  if (!timeStep || timeStep === 1) {
    return dateString
  }

  const date = parseISO(dateString)
  const minutes = getMinutes(date)
  const leftOver = minutes % timeStep
  if (leftOver !== 0) {
    return serialize(setMinutes(date, minutes - leftOver))
  }

  return serialize(date)
}

export const DateTimeInput = React.forwardRef(function DateTimeInput(
  props: DateTimeInputProps,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
) {
  const {type, onChange, ...rest} = props
  const {title, description, placeholder} = type

  const {dateFormat, timeFormat, timeStep} = parseOptions(type.options)

  const handleChange = useCallback(
    (nextDate: string | null) => {
      let date = nextDate
      if (date !== null && timeStep > 1) {
        date = enforceTimeStep(date, timeStep)
      }

      onChange(PatchEvent.from([date === null ? unset() : set(date)]))
    },
    [onChange, timeStep]
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
