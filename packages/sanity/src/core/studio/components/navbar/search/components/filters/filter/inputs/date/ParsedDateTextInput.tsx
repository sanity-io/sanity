import {format, isValid, parse} from 'date-fns'
import React, {
  ChangeEvent,
  ComponentProps,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {CustomTextInput} from '../../../../common/CustomTextInput'
import {getDateISOString} from './utils/getDateISOString'

interface ParsedDateTextInputProps
  extends Omit<ComponentProps<typeof CustomTextInput>, 'onChange' | 'value'> {
  /**
   * Determines whether `onChange` returns a full or partial ISO-8601 string.
   * e.g. '2023-01-04T10:00:00.000Z' or '2023-01-04'
   */
  isDateTime: boolean
  /**
   * Determines whether dates are formatted with full or partial date format
   * e.g. 'Feb 1, 2000 12:00 AM' vs 'Feb 1, 2000'
   */
  isDateTimeFormat?: boolean
  onChange: (val: string | null) => void
  placeholderDate?: Date
  value?: string | null
}

const DATE_FORMAT = 'MMM d, yyyy' // Feb 1, 2000
const DATETIME_FORMAT = 'MMM d, yyyy p' // Feb 1, 2000 12:00 AM

export function ParsedDateTextInput({
  isDateTime,
  onChange,
  placeholderDate,
  isDateTimeFormat,
  value,
  ...rest
}: ParsedDateTextInputProps) {
  const dateFormat = useMemo(
    () => (isDateTimeFormat ? DATETIME_FORMAT : DATE_FORMAT),
    [isDateTimeFormat]
  )

  const [customValidity, setCustomValidity] = useState<string | undefined>(undefined)
  const [inputValue, setInputValue] = useState<string>(() => {
    if (!value) {
      return ''
    }
    const inputValueDate = new Date(value)
    return format(inputValueDate, dateFormat)
  })

  /**
   * Conditionally create placeholder text
   */
  const formattedPlaceholder = useMemo(() => {
    const date = placeholderDate || new Date()
    return format(date, dateFormat)
  }, [dateFormat, placeholderDate])

  /**
   * Process current input value:
   * - If `useDateFormat = true`, parse custom date string format and create date object.
   * (Otherwise assume ISO-8601 format).
   * - Validate the parsed date, update `customValidity` state on <TextInput />
   * - If valid, update local input value and optionally trigger onChange callback.
   */
  const processInputString = useCallback(
    ({dateString, triggerOnChange}: {dateString: string; triggerOnChange?: boolean}) => {
      if (!dateString) {
        return
      }
      const dateParsed = parse(dateString, dateFormat, new Date())
      const validDate = isValid(dateParsed)
      if (validDate) {
        if (triggerOnChange) {
          onChange(getDateISOString({date: dateParsed, dateOnly: !isDateTime}))
        }
        setInputValue(format(dateParsed, dateFormat))
      }
      setCustomValidity(validDate ? undefined : `Invalid ${isDateTime ? 'datetime' : 'date'}`)
    },
    [dateFormat, isDateTime, onChange]
  )

  /**
   * Re-process (parse, validate and update) current input value on blur
   */
  const handleTextInputBlur = useCallback(() => {
    processInputString({dateString: inputValue, triggerOnChange: true})
  }, [inputValue, processInputString])

  const handleTextInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.currentTarget.value)
  }, [])

  /**
   * Reset state on input clear
   */
  const handleTextInputClear = useCallback(() => {
    onChange(null)
    setCustomValidity(undefined)
    setInputValue('')
  }, [onChange])

  /**
   * Re-process (parse, validate and update) current input value on ENTER
   */
  const handleTextInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        processInputString({dateString: inputValue, triggerOnChange: true})
      }
    },
    [inputValue, processInputString]
  )

  /**
   * Re-process input string when props value is updated
   */
  useEffect(() => {
    const updatedDate = value && new Date(value)
    if (updatedDate) {
      processInputString({
        dateString: format(updatedDate, dateFormat),
        triggerOnChange: false,
      })
    }
  }, [dateFormat, processInputString, isDateTimeFormat, value])

  return (
    <CustomTextInput
      {...rest}
      clearButton={!!inputValue}
      customValidity={customValidity}
      onBlur={handleTextInputBlur}
      onChange={handleTextInputChange}
      onClear={handleTextInputClear}
      onKeyDown={handleTextInputKeyDown}
      placeholder={formattedPlaceholder}
      value={inputValue}
    />
  )
}
