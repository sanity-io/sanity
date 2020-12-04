import React from 'react'
import {Marker} from '@sanity/types'
import {useId} from '@reach/auto-id'
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
  onParseError: (err: Error | null) => void
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

  const [parseError, setParseError] = React.useState<Error>()

  const {dateFormat, timeFormat} = parseOptions(type.options)

  const fullFormat = `${dateFormat} ${timeFormat}`

  const format = (date: Date) => moment(date).format(fullFormat)

  const parse = (dateString: string) => {
    const parsed = moment(dateString, fullFormat, true)
    if (parsed.isValid()) {
      return parsed.toDate()
    }
    throw new Error(`Invalid date. Must be on the format "${fullFormat}"`)
  }

  const handleDatePickerChange = (nextDate: Date | undefined) => {
    onChange(PatchEvent.from([nextDate ? set(nextDate.toISOString()) : unset()]))
    setParseError(undefined)
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
        selectTime
        ref={inputRef}
        value={value && new Date(value)}
        readOnly={readOnly}
        onChange={handleDatePickerChange}
        customValidity={parseError?.message}
        onParseError={(err) => setParseError(err)}
      />
    </FormField>
  )
})

export default DateTimeInput
