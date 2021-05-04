/* eslint-disable no-nested-ternary */
import React, {useEffect} from 'react'
import {FormField} from '@sanity/base/components'
import {Marker} from '@sanity/types'
import {useId} from '@reach/auto-id'
import {useForwardedRef, TextInput} from '@sanity/ui'
import {DateTimeInput} from './base/DateTimeInput'
import {CommonProps, ParseResult} from './types'

type Props = CommonProps & {
  title: string
  description?: string
  parseInputValue: (inputValue: string) => ParseResult
  formatInputValue: (date: Date) => string
  deserialize: (value: string) => ParseResult
  serialize: (date: Date) => string
  onChange: (nextDate: string | null) => void
  selectTime?: boolean
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
    parseInputValue,
    formatInputValue,
    deserialize,
    serialize,
    selectTime,
    timeStep,
    readOnly,
    level,
    presence,
    onChange,
    ...rest
  } = props

  const [localValue, setLocalValue] = React.useState<string | null>(null)

  useEffect(() => {
    setLocalValue(null)
  }, [value])

  const handleDatePickerInputChange = React.useCallback(
    (event) => {
      const nextInputValue = event.currentTarget.value
      const result = nextInputValue === '' ? null : parseInputValue(nextInputValue)
      if (result === null) {
        onChange(null)
      } else if (result.isValid) {
        onChange(serialize(result.date))
      } else {
        setLocalValue(nextInputValue)
      }
    },
    [serialize, onChange, parseInputValue]
  )

  const handleDatePickerChange = React.useCallback(
    (nextDate: Date | null) => {
      onChange(nextDate ? serialize(nextDate) : null)
    },
    [serialize, onChange]
  )

  const inputRef = useForwardedRef(forwardedRef)

  const id = useId()

  const parseResult = localValue ? parseInputValue(localValue) : value ? deserialize(value) : null

  const inputValue = localValue
    ? localValue
    : parseResult?.isValid
    ? formatInputValue(parseResult.date)
    : value

  return (
    <FormField
      markers={
        parseResult?.error
          ? [
              ...markers,
              ({
                type: 'validation',
                level: 'error',
                item: {message: parseResult.error, paths: []},
              } as unknown) as Marker, // casting to marker to avoid having to implement cloneWithMessage on item
            ]
          : markers
      }
      title={title}
      level={level}
      description={description}
      presence={presence}
      inputId={id}
    >
      {readOnly ? (
        <TextInput value={inputValue} readOnly />
      ) : (
        <DateTimeInput
          {...rest}
          id={id}
          selectTime={selectTime}
          timeStep={timeStep}
          placeholder={placeholder || `e.g. ${formatInputValue(DEFAULT_PLACEHOLDER_TIME)}`}
          ref={inputRef}
          value={parseResult?.date}
          inputValue={inputValue || ''}
          readOnly={Boolean(readOnly)}
          onInputChange={handleDatePickerInputChange}
          onChange={handleDatePickerChange}
          customValidity={parseResult?.error}
        />
      )}
    </FormField>
  )
})
