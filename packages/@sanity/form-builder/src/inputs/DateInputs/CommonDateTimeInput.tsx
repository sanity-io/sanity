/* eslint-disable no-nested-ternary */
import React from 'react'
import {Marker} from '@sanity/types'
import {useId} from '@reach/auto-id'

import {useForwardedRef, TextInput} from '@sanity/ui'
import PatchEvent, {set, unset} from '../../PatchEvent'

import {FormField} from '../../components/FormField'
import {DateTimeInput} from './base/DateTimeInput'
import {format, parse} from './legacy'
import {CommonProps} from './types'

type Props = CommonProps & {
  title: string
  description: string
  inputFormat: string
  selectTime: boolean
  placeholder?: string
  timeStep?: number
}

const DEFAULT_PLACEHOLDER_TIME = new Date()

export const CommonDateTimeInput = React.forwardRef(function CommonDateTimeInput(
  props: Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
) {
  const {
    value,
    markers,
    title,
    description,
    placeholder,
    inputFormat,
    selectTime,
    timeStep,
    readOnly,
    level,
    presence,
    onChange,
    ...rest
  } = props

  const [parseError, setParseError] = React.useState<string>()
  const [inputValue, setInputValue] = React.useState<string>()

  const handleDatePickerInputChange = React.useCallback(
    (event) => {
      const nextInputValue = event.currentTarget.value
      setParseError(undefined)
      setInputValue(undefined)
      if (!nextInputValue) {
        onChange(PatchEvent.from([unset()]))
        return
      }
      const result = parse(nextInputValue, inputFormat)
      if (result.isValid) {
        onChange(PatchEvent.from([set(result.date.toISOString())]))
      } else {
        setParseError(result.error)
        // keep the input value floating around as long as it's invalid so that the
        // user can continue to edit
        setInputValue(nextInputValue)
      }
    },
    [onChange, inputFormat]
  )

  const handleDatePickerChange = React.useCallback(
    (nextDate: Date) => {
      onChange(PatchEvent.from([set(nextDate.toISOString())]))
      setParseError(undefined)
      setInputValue(undefined)
    },
    [onChange]
  )

  const inputRef = useForwardedRef(forwardedRef)

  const id = useId()

  const valueAsDate = value && new Date(value)
  const textInputValue = inputValue
    ? inputValue
    : valueAsDate
    ? format(valueAsDate, inputFormat)
    : ''
  return (
    <FormField
      markers={
        parseError
          ? [
              ...markers,
              ({
                type: 'validation',
                level: 'error',
                item: {message: parseError, paths: []},
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
      {readOnly ? (
        <TextInput value={textInputValue} disabled />
      ) : (
        <DateTimeInput
          {...rest}
          id={id}
          selectTime={selectTime}
          timeStep={timeStep}
          placeholder={placeholder || `e.g. ${format(DEFAULT_PLACEHOLDER_TIME, inputFormat)}`}
          ref={inputRef}
          value={valueAsDate}
          inputValue={inputValue ? inputValue : valueAsDate ? format(valueAsDate, inputFormat) : ''}
          readOnly={readOnly}
          onInputChange={handleDatePickerInputChange}
          onChange={handleDatePickerChange}
          customValidity={parseError}
        />
      )}
    </FormField>
  )
})
