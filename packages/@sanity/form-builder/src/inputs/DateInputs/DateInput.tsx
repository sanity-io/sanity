import React from 'react'

import {CommonDateTimeInput} from './CommonDateTimeInput'
import {CommonProps} from './types'

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

type Props = CommonProps & {
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
    calendarTodayLabel: options.calendarTodayLabel || 'Today',
  }
}

export const DateInput = React.forwardRef(function DateInput(
  props: Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
) {
  const {type, ...rest} = props
  const {title, description, placeholder} = type

  const {dateFormat} = parseOptions(type.options)

  return (
    <CommonDateTimeInput
      {...rest}
      ref={forwardedRef}
      selectTime={false}
      title={title}
      description={description}
      placeholder={placeholder}
      inputFormat={dateFormat}
    />
  )
})
