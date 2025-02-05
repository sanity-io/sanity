import {EarthGlobeIcon} from '@sanity/icons'
import {Inline, Text} from '@sanity/ui'
import {
  DEFAULT_DATE_FORMAT,
  DEFAULT_TIME_FORMAT,
  format,
  isValidTimezoneString,
  parse,
} from '@sanity/util/legacyDateFormat'
import {getMinutes, parseISO, setMinutes} from 'date-fns'
import {useCallback, useMemo} from 'react'

import {Tooltip} from '../../../../ui-components'
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
  displayTimezone?: string
}

interface SchemaOptions {
  dateFormat?: string
  timeFormat?: string
  timeStep?: number
  displayTimezone?: string
}

/**
 * @hidden
 * @beta */
export type DateTimeInputProps = StringInputProps

const serialize = (date: Date) => {
  return date.toISOString()
}

function parseOptions(options: SchemaOptions = {}): ParsedOptions {
  return {
    dateFormat: options.dateFormat || DEFAULT_DATE_FORMAT,
    timeFormat: options.timeFormat || DEFAULT_TIME_FORMAT,
    timeStep: ('timeStep' in options && Number(options.timeStep)) || 1,
    displayTimezone:
      options.displayTimezone && isValidTimezoneString(options.displayTimezone)
        ? options.displayTimezone
        : undefined,
  }
}

const getDeserializer =
  (timezone?: string) =>
  (isoString: string): ParseResult => {
    // create a date object respecting the timezone
    const {date: deserialized} = parse(isoString, undefined, timezone)
    if (deserialized && isValidDate(deserialized)) {
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

  const {dateFormat, timeFormat, timeStep, displayTimezone} = parseOptions(schemaType.options)
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
    (date: Date) => format(date, `${dateFormat} ${timeFormat}`, {timezone: displayTimezone}),
    [dateFormat, timeFormat, displayTimezone],
  )

  const deserialize = useMemo(() => getDeserializer(displayTimezone), [displayTimezone])
  const memoizedSerialize = useMemo(() => serialize, [])

  const parseInputValue = useCallback(
    (inputValue: string): ParseResult =>
      parse(inputValue, `${dateFormat} ${timeFormat}`, displayTimezone),
    [dateFormat, timeFormat, displayTimezone],
  )
  const calendarLabels: CalendarLabels = useMemo(() => getCalendarLabels(t), [t])
  const commonProps = useMemo(
    () => ({
      ...elementProps,
      calendarLabels,
      deserialize,
      formatInputValue,
      onChange: handleChange,
      parseInputValue,
      placeholder: schemaType.placeholder,
      serialize: memoizedSerialize,
      timezone: displayTimezone,
      timeStep,
      selectTime: true,
      value,
    }),
    [
      elementProps,
      calendarLabels,
      deserialize,
      formatInputValue,
      handleChange,
      parseInputValue,
      schemaType.placeholder,
      memoizedSerialize,
      displayTimezone,
      timeStep,
      value,
    ],
  )

  return displayTimezone ? (
    <Tooltip
      placement="bottom-start"
      content={
        <Inline space={1}>
          <EarthGlobeIcon />
          <Text size={1} muted>
            {t('inputs.datetime.timezone-information-text', {timezone: displayTimezone})}
          </Text>
        </Inline>
      }
    >
      <CommonDateTimeInput {...commonProps} />
    </Tooltip>
  ) : (
    <CommonDateTimeInput {...commonProps} />
  )
}
