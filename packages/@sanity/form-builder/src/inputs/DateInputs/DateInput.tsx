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
    calendarTodayLabel: options.calendarTodayLabel || 'Today',
  }
}

const DateTimeInput = React.forwardRef(function DateTimeInput(
  props: Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
) {
  const {value, markers, type, readOnly, level, presence, onChange, ...rest} = props
  const {title, description} = type

  const [parseError, setParseError] = React.useState<Error | null>(null)

  const {dateFormat} = parseOptions(type.options)

  const format = (date: Date) => moment(date).format(dateFormat)

  const parse = (dateString: string) => {
    const parsed = moment(dateString, dateFormat, true)
    if (parsed.isValid()) {
      return parsed.toDate()
    }
    throw new Error(`Invalid date. Must be on the format "${dateFormat}"`)
  }

  const handleDatePickerChange = (nextDate: Date | null) => {
    onChange(PatchEvent.from([nextDate ? set(nextDate.toISOString()) : unset()]))
    setParseError(null)
  }

  const inputRef = useForwardedRef(forwardedRef)

  const id = useId()

  return (
    <FormField
      markers={
        parseError
          ? [
              ...markers,
              ({
                type: 'validation',
                level: 'error',
                item: {message: parseError.message, paths: []},
              } as unknown) as Marker, // casting to marker to avoid having to implement cloneWithMessage on item
            ]
          : markers
      }
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
        customValidity={parseError?.message}
        onParseError={(err) => setParseError(err)}
      />
    </FormField>
  )
})

export default DateTimeInput
