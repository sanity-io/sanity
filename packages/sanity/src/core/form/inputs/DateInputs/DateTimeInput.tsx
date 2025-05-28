import {
  DEFAULT_DATE_FORMAT,
  DEFAULT_TIME_FORMAT,
  format,
  parse,
} from '@sanity/util/legacyDateFormat'
import {getMinutes, parseISO, setMinutes} from 'date-fns'
import {useCallback, useMemo} from 'react'

import {type CalendarLabels} from '../../../components/inputs/DateInputs/calendar/types'
import {useTranslation} from '../../../i18n'
import {set, unset} from '../../patch'
import {type StringInputProps} from '../../types'
import {CommonDateTimeInput} from './CommonDateTimeInput'
import {type ParseResult} from './types'
import {getCalendarLabels, isValidDate} from './utils'

interface ParsedOptions {
  dateFormat: string
  timeFormat: string
  timeStep: number
}

interface SchemaOptions {
  dateFormat?: string
  timeFormat?: string
  timeStep?: number
}

/**
 * @hidden
 * @beta */
export type DateTimeInputProps = StringInputProps

function parseOptions(options: SchemaOptions = {}): ParsedOptions {
  return {
    dateFormat: options.dateFormat || DEFAULT_DATE_FORMAT,
    timeFormat: options.timeFormat || DEFAULT_TIME_FORMAT,
    timeStep: ('timeStep' in options && Number(options.timeStep)) || 1,
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

/**
 * @hidden
 * @beta */
export function DateTimeInput(props: DateTimeInputProps) {
  const {onChange, schemaType, value, elementProps} = props

  const {dateFormat, timeFormat, timeStep} = parseOptions(schemaType.options)
  const {t} = useTranslation()

  const handleChange = useCallback(
    (nextDate: string | null) => {
      let date = nextDate
      if (date !== null && timeStep > 1) {
        date = enforceTimeStep(date, timeStep)
      }

      onChange(date === null ? unset() : set(date))
    },
    [onChange, timeStep],
  )

  const formatInputValue = useCallback(
    (date: Date) => format(date, `${dateFormat} ${timeFormat}`),
    [dateFormat, timeFormat],
  )

  const parseInputValue = useCallback(
    (inputValue: string) => parse(inputValue, `${dateFormat} ${timeFormat}`),
    [dateFormat, timeFormat],
  )
  const calendarLabels: CalendarLabels = useMemo(() => getCalendarLabels(t), [t])
  return (
    <CommonDateTimeInput
      {...elementProps}
      calendarLabels={calendarLabels}
      onChange={handleChange}
      deserialize={deserialize}
      formatInputValue={formatInputValue}
      parseInputValue={parseInputValue}
      placeholder={schemaType.placeholder}
      selectTime
      serialize={serialize}
      timeStep={timeStep}
      value={value}
    />
  )
}
