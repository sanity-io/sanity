import {
  type FocusEvent,
  type ForwardedRef,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

import {type CalendarLabels} from '../../../components/inputs/DateInputs/calendar/types'
import {DateTimeInput} from '../../../components/inputs/DateInputs/DateTimeInput'
import {type TimeZoneScope} from '../../../hooks/useTimeZone'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {type ParseResult} from './types'

export interface CommonDateTimeInputProps {
  id: string
  deserialize: (value: string) => ParseResult
  formatInputValue: (date: Date) => string
  onChange: (nextDate: string | null) => void
  /**
   * Called when the parser's error state changes. Receives the error message
   * while the typed input cannot be parsed (e.g. doesn't match the configured
   * `dateFormat`), and `null` once it becomes parseable or empty. Used by the
   * wrapping date/datetime input to report into the document validation graph.
   */
  onParseError?: (error: string | null) => void
  parseInputValue: (inputValue: string) => ParseResult
  placeholder?: string
  readOnly: boolean | undefined
  selectTime?: boolean
  serialize: (date: Date) => string
  timeStep?: number
  value: string | undefined
  calendarLabels: CalendarLabels
  timeZoneScope: TimeZoneScope
  validationError?: string
}

const DEFAULT_PLACEHOLDER_TIME = new Date()

export const CommonDateTimeInput = forwardRef(function CommonDateTimeInput(
  props: CommonDateTimeInputProps,
  forwardedRef: ForwardedRef<HTMLInputElement>,
) {
  const {
    id,
    deserialize,
    formatInputValue,
    onChange,
    onParseError,
    parseInputValue,
    placeholder,
    readOnly,
    selectTime,
    serialize,
    timeStep,
    timeZoneScope,
    value,
    validationError,
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

  const ref = useRef<HTMLInputElement | null>(null)

  useImperativeHandle<HTMLInputElement | null, HTMLInputElement | null>(
    forwardedRef,
    () => ref.current,
  )
  const parseResult = localValue ? parseInputValue(localValue) : value ? deserialize(value) : null

  const inputValue = localValue
    ? localValue
    : parseResult?.isValid
      ? formatInputValue(parseResult.date)
      : value

  // Forward parse errors to the wrapping field. Invalid input never reaches
  // `onChange`, so without this they'd be swallowed and validators would
  // continue to run against an undefined value.
  const parseError = parseResult?.error ?? null
  useEffect(() => {
    onParseError?.(parseError)
  }, [onParseError, parseError])

  return (
    <DateTimeInput
      {...restProps}
      calendarLabels={props.calendarLabels}
      id={id}
      selectTime={selectTime}
      timeStep={timeStep}
      timeZoneScope={timeZoneScope}
      placeholder={
        placeholder ||
        t('inputs.datetime.placeholder', {
          example: formatInputValue(DEFAULT_PLACEHOLDER_TIME),
        })
      }
      ref={ref}
      value={parseResult?.date}
      inputValue={inputValue || ''}
      readOnly={Boolean(readOnly)}
      onInputChange={handleDatePickerInputChange}
      onChange={handleDatePickerChange}
      customValidity={parseError || validationError}
    />
  )
})
