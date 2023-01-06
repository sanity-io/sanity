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
  onChange: (val: string | null) => void
  placeholderDate?: Date
  selectTime?: boolean
  value?: string | null
}

const DATE_FORMAT = 'MMM d, yyyy' // Feb 1, 2000
const DATETIME_FORMAT = 'MMM d, yyyy p' // Feb 1, 2000 12:00 AM

export function ParsedDateTextInput({
  onChange,
  placeholderDate,
  selectTime,
  value,
  ...rest
}: ParsedDateTextInputProps) {
  const dateFormat = useMemo(() => (selectTime ? DATETIME_FORMAT : DATE_FORMAT), [selectTime])

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
      const dateParsed = parse(dateString, dateFormat, new Date())
      const validDate = isValid(dateParsed)
      if (validDate) {
        if (triggerOnChange) {
          onChange(getDateISOString({date: dateParsed, dateOnly: !selectTime}))
        }
        setInputValue(format(dateParsed, dateFormat))
      }
      setCustomValidity(validDate ? undefined : `Invalid ${selectTime ? 'datetime' : 'date'}`)
    },
    [dateFormat, onChange, selectTime]
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
  }, [dateFormat, processInputString, selectTime, value])

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
