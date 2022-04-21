/* eslint-disable no-nested-ternary */
import React, {useEffect} from 'react'
import {ValidationMarker, StringSchemaType} from '@sanity/types'
import {useId} from '@reach/auto-id'
import {useForwardedRef, TextInput} from '@sanity/ui'
import {FormField} from '../../../components/formField'
import {FormInputProps} from '../../types'
import {DateTimeInput} from './base/DateTimeInput'
import {ParseResult} from './types'

export interface CommonDateTimeInputProps
  extends Omit<FormInputProps<string, StringSchemaType>, 'onChange' | 'type'> {
  title?: string
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
  props: CommonDateTimeInputProps,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
) {
  const {
    value,
    validation,
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

        // If the field value is undefined and we are clearing the invalid value
        // the above useEffect won't trigger, so we do some extra clean up here
        if (typeof value === 'undefined' && localValue) {
          setLocalValue(null)
        }
      } else if (result.isValid) {
        onChange(serialize(result.date))
      } else {
        setLocalValue(nextInputValue)
      }
    },
    [localValue, serialize, onChange, parseInputValue]
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
      validation={
        parseResult?.error
          ? [
              ...validation,
              {
                level: 'error',
                item: {message: parseResult.error, paths: []},
              } as unknown as ValidationMarker, // casting to marker to avoid having to implement cloneWithMessage on item
            ]
          : validation
      }
      title={title}
      level={level}
      description={description}
      __unstable_presence={presence}
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
