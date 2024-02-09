/* eslint-disable no-nested-ternary */

import {TextInput, useForwardedRef} from '@sanity/ui'
import {
  type FocusEvent,
  type ForwardedRef,
  forwardRef,
  useCallback,
  useEffect,
  useState,
} from 'react'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {type CalendarLabels} from './base/calendar/types'
import {DateTimeInput} from './base/DateTimeInput'
import {type ParseResult} from './types'

export interface CommonDateTimeInputProps {
  id: string
  deserialize: (value: string) => ParseResult
  formatInputValue: (date: Date) => string
  onChange: (nextDate: string | null) => void
  parseInputValue: (inputValue: string) => ParseResult
  placeholder?: string
  readOnly: boolean | undefined
  selectTime?: boolean
  serialize: (date: Date) => string
  timeStep?: number
  value: string | undefined
  calendarLabels: CalendarLabels
}

const DEFAULT_PLACEHOLDER_TIME = new Date()

export const CommonDateTimeInput = forwardRef(function CommonDateTimeInput(
  props: CommonDateTimeInputProps,
  ref: ForwardedRef<HTMLInputElement>,
) {
  const {
    id,
    deserialize,
    formatInputValue,
    onChange,
    parseInputValue,
    placeholder,
    readOnly,
    selectTime,
    serialize,
    timeStep,
    value,
    ...restProps
  } = props

  const [localValue, setLocalValue] = useState<string | null>(null)

  const {t} = useTranslation()

  useEffect(() => {
    setLocalValue(null)
  }, [value])

  const handleDatePickerInputChange = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
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
    [parseInputValue, onChange, value, localValue, serialize],
  )

  const handleDatePickerChange = useCallback(
    (nextDate: Date | null) => {
      onChange(nextDate ? serialize(nextDate) : null)
    },
    [serialize, onChange],
  )

  const forwardedRef = useForwardedRef(ref)

  const parseResult = localValue ? parseInputValue(localValue) : value ? deserialize(value) : null

  const inputValue = localValue
    ? localValue
    : parseResult?.isValid
      ? formatInputValue(parseResult.date)
      : value

  return readOnly ? (
    <TextInput value={inputValue} readOnly />
  ) : (
    <DateTimeInput
      {...restProps}
      calendarLabels={props.calendarLabels}
      id={id}
      selectTime={selectTime}
      timeStep={timeStep}
      placeholder={
        placeholder ||
        t('inputs.datetime.placeholder', {
          example: formatInputValue(DEFAULT_PLACEHOLDER_TIME),
        })
      }
      ref={forwardedRef}
      value={parseResult?.date}
      inputValue={inputValue || ''}
      readOnly={Boolean(readOnly)}
      onInputChange={handleDatePickerInputChange}
      onChange={handleDatePickerChange}
      customValidity={parseResult?.error}
    />
  )
})
