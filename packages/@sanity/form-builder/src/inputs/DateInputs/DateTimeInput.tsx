import React, {useCallback} from 'react'

import PatchEvent, {set, unset} from '../../PatchEvent'
import {CommonDateTimeInput} from './CommonDateTimeInput'
import {CommonProps} from './types'

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
type Props = CommonProps & {
  onChange: (event: PatchEvent) => void
  type: {
    name: string
    title: string
    description: string
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

export const DateTimeInput = React.forwardRef(function DateTimeInput(
  props: Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
) {
  const {type, onChange, ...rest} = props
  const {title, description, placeholder} = type

  const {dateFormat, timeFormat, timeStep} = parseOptions(type.options)

  const handleChange = useCallback(
    (nextDate: Date | null) => {
      onChange(PatchEvent.from([nextDate === null ? unset() : set(nextDate.toISOString())]))
    },
    [onChange]
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
      inputFormat={`${dateFormat} ${timeFormat}`}
    />
  )
})
