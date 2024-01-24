import React, {useCallback, useMemo} from 'react'
import {format, parse, DEFAULT_DATE_FORMAT} from '@sanity/util/legacyDateFormat'
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

const deserialize = (value: string) => parse(value, DEFAULT_DATE_FORMAT)
const serialize = (date: Date) => format(date, DEFAULT_DATE_FORMAT)

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
