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
  useDateFormat?: boolean
  value?: string | null
}

const DATE_FORMAT = 'MMM d, yyyy' // Feb 1, 2000
const DATETIME_FORMAT = 'MMM d, yyyy p' // Feb 1, 2000 12:00 AM

export function ParsedDateTextInput({
  onChange,
  placeholderDate,
  selectTime,
  useDateFormat = true,
  value,
  ...rest
}: ParsedDateTextInputProps) {
  const dateFormat = useMemo(() => {
    return selectTime ? DATETIME_FORMAT : DATE_FORMAT
  }, [selectTime])

  const formattedPlaceholder = useMemo(() => {
    const date = placeholderDate || new Date()
    return formatDate({date, dateFormat, selectTime, useDateFormat})
  }, [dateFormat, placeholderDate, selectTime, useDateFormat])

  const [customValidity, setCustomValidity] = useState<string | undefined>(undefined)
  const [inputValue, setInputValue] = useState<string>(() => {
    if (!value) {
      return ''
    }
    const inputValueDate = new Date(value)
    return formatDate({date: inputValueDate, dateFormat, selectTime, useDateFormat})
  })

  const parseInputValue = useCallback(() => {
    if (inputValue) {
      let dateParsed: Date
      if (useDateFormat) {
        dateParsed = parse(inputValue, dateFormat, new Date())
      } else {
        dateParsed = new Date(inputValue)
      }

      const validDate = isValid(dateParsed)
      if (validDate) {
        onChange(
          getDateISOString({
            date: dateParsed,
            dateOnly: !selectTime,
          })
        )
        setInputValue(formatDate({date: dateParsed, dateFormat, selectTime, useDateFormat}))
      }
      setCustomValidity(validDate ? undefined : `Invalid ${selectTime ? 'datetime' : 'date'}`)
    }
  }, [dateFormat, inputValue, onChange, selectTime, useDateFormat])

  const handleTextInputBlur = useCallback(() => {
    parseInputValue()
  }, [parseInputValue])

  const handleTextInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.currentTarget.value)
  }, [])

  const handleTextInputClear = useCallback(() => {
    onChange(null)
    setCustomValidity(undefined)
    setInputValue('')
  }, [onChange])

  const handleTextInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        parseInputValue()
      }
    },
    [parseInputValue]
  )

  useEffect(() => {
    const updatedDate = value && new Date(value)
    if (updatedDate && isValid(updatedDate)) {
      setInputValue(
        formatDate({
          date: updatedDate,
          dateFormat,
          selectTime,
          useDateFormat,
        })
      )
      setCustomValidity(undefined)
    } else {
      setInputValue('')
    }
  }, [dateFormat, selectTime, useDateFormat, value])

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

function formatDate({
  date,
  dateFormat,
  selectTime,
  useDateFormat,
}: {
  date: Date
  dateFormat: string
  selectTime?: boolean
  useDateFormat?: boolean
}) {
  return useDateFormat ? format(date, dateFormat) : getDateISOString({date, dateOnly: !selectTime})
}
