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

const FORMAT: Record<
  'date' | 'datetime',
  {
    custom: string
    iso8601: string
  }
> = {
  date: {
    custom: 'MMM d, yyyy', // Feb 1, 2000
    iso8601: 'yyyy-MM-dd', // 2000-02-01
  },
  datetime: {
    custom: 'MMM d, yyyy p', // Feb 1, 2000 12:00 AM
    iso8601: `yyyy-MM-dd'T'HH:mm:ss'Z'`, // 2000-02-01T12:00:00Z
  },
}

export function ParsedDateTextInput({
  onChange,
  placeholderDate,
  selectTime,
  useDateFormat = true,
  value,
  ...rest
}: ParsedDateTextInputProps) {
  const dateFormat = useMemo(() => {
    const fmt = useDateFormat ? 'custom' : 'iso8601'
    return selectTime ? FORMAT.datetime[fmt] : FORMAT.date[fmt]
  }, [selectTime, useDateFormat])

  const formattedPlaceholder = useMemo(() => {
    const date = placeholderDate || new Date()
    return format(date, dateFormat)
  }, [dateFormat, placeholderDate])

  const [customValidity, setCustomValidity] = useState<string | undefined>(undefined)
  const [inputValue, setInputValue] = useState<string>(() => {
    if (!value) {
      return ''
    }
    return useDateFormat ? format(new Date(value), dateFormat) : value
  })

  const parseInputValue = useCallback(() => {
    if (inputValue) {
      const dateParsed = parse(inputValue, dateFormat, new Date())
      const validDate = isValid(dateParsed)
      if (validDate) {
        const dateString = getDateISOString({
          date: dateParsed,
          isDateTime: selectTime,
        })
        onChange(dateString)
      }
      setCustomValidity(validDate ? undefined : `Invalid ${selectTime ? 'datetime' : 'date'}`)
    }
  }, [dateFormat, inputValue, onChange, selectTime])

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
      setInputValue(format(updatedDate, dateFormat))
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
