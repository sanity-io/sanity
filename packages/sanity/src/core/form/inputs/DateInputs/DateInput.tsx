import React, {useCallback, useMemo} from 'react'
import {format, parse} from '@sanity/util/legacyDateFormat'
import {set, unset} from '../../patch'
import {StringInputProps} from '../../types'
import {useTranslation} from '../../../i18n'
import {CommonDateTimeInput} from './CommonDateTimeInput'
import {CalendarLabels} from './base/calendar/types'
import {getCalendarLabels} from './utils'

/**
 * @hidden
 * @beta */
export type DateInputProps = StringInputProps

// This is the format dates are stored on
const VALUE_FORMAT = 'YYYY-MM-DD'
// default to how they are stored
const DEFAULT_DATE_FORMAT = VALUE_FORMAT

const deserialize = (value: string) => parse(value, VALUE_FORMAT)
const serialize = (date: Date) => format(date, VALUE_FORMAT)

/**
 * @hidden
 * @beta */
export function DateInput(props: DateInputProps) {
  const {readOnly, onChange, schemaType, elementProps, value} = props
  const dateFormat = schemaType.options?.dateFormat || DEFAULT_DATE_FORMAT
  const {t} = useTranslation()

  const handleChange = useCallback(
    (nextDate: string | null) => {
      onChange(nextDate === null ? unset() : set(nextDate))
    },
    [onChange],
  )

  const formatInputValue = useCallback((date: Date) => format(date, dateFormat), [dateFormat])

  const parseInputValue = useCallback(
    (inputValue: string) => parse(inputValue, dateFormat),
    [dateFormat],
  )

  const calendarLabels: CalendarLabels = useMemo(() => getCalendarLabels(t), [t])
  return (
    <CommonDateTimeInput
      {...elementProps}
      deserialize={deserialize}
      formatInputValue={formatInputValue}
      onChange={handleChange}
      parseInputValue={parseInputValue}
      placeholder={schemaType.placeholder}
      calendarLabels={calendarLabels}
      readOnly={readOnly}
      selectTime={false}
      serialize={serialize}
      value={value}
    />
  )
}
