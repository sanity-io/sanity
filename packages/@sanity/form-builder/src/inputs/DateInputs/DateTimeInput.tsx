import React from 'react'
import {Marker} from '@sanity/types'
import {useId} from '@reach/auto-id'
import type {Moment} from 'moment'
import moment from 'moment'

import {useForwardedRef} from '@sanity/ui'
import PatchEvent, {set, unset} from '../../PatchEvent'

import {FormField} from '../../components/FormField'
import BaseDateTimeInput from './base/BaseDateTimeInput'

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
type Props = {
  value: string
  markers: Marker[]
  type: {
    name: string
    title: string
    description: string
    options?: SchemaOptions
    placeholder?: string
  }
  readOnly: boolean | null
  onChange: (event: PatchEvent) => void
  level: number
  onFocus: () => void
  presence: any
}

function parseOptions(options: SchemaOptions = {}): ParsedOptions {
  return {
    dateFormat: options.dateFormat || DEFAULT_DATE_FORMAT,
    timeFormat: options.timeFormat || DEFAULT_TIME_FORMAT,
    timeStep: ('timeStep' in options && Number(options.timeStep)) || 15,
    calendarTodayLabel: options.calendarTodayLabel || 'Today',
  }
}

const DateTimeInput = React.forwardRef(function DateTimeInput(
  props: Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
) {
  const {value, markers, type, readOnly, level, presence, onChange, ...rest} = props
  const {title, description} = type

  const {dateFormat, timeFormat} = parseOptions(type.options)

  const format = (date: Date) => moment(date).format(`${dateFormat} ${timeFormat}`)

  const parse = (dateString: string) => {
    const parsed = moment(dateString, dateFormat, true)
    return parsed.isValid() ? parsed.toDate() : null
  }

  const handleDatePickerChange = (nextDate: Date | null) => {
    onChange(PatchEvent.from([nextDate ? set(nextDate.toISOString()) : unset()]))
  }

  const inputRef = useForwardedRef(forwardedRef)

  const id = useId()

  return (
    <FormField
      markers={markers}
      label={title}
      level={level}
      description={description}
      presence={presence}
      labelFor={id}
    >
      <BaseDateTimeInput
        {...rest}
        id={id}
        format={format}
        parse={parse}
        ref={inputRef}
        value={value ? new Date(value) : null}
        readOnly={readOnly}
        onChange={handleDatePickerChange}
      />
    </FormField>
  )
})

export default DateTimeInput
