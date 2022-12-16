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

interface ParsedDateTextInputProps
  extends Omit<ComponentProps<typeof CustomTextInput>, 'onChange' | 'value'> {
  onChange: (val: string | null) => void
  placeholderDate?: Date
  selectTime?: boolean
  value?: string | null
}

const DEFAULT_DATE_FORMAT = 'MMM d, yyyy'
const DEFAULT_TIME_FORMAT = 'p'

export function ParsedDateTextInput({
  onChange,
  placeholderDate = new Date(),
  selectTime,
  value,
  ...rest
}: ParsedDateTextInputProps) {
  const dateFormat = useMemo(
    () => [DEFAULT_DATE_FORMAT, ...(selectTime ? [DEFAULT_TIME_FORMAT] : [])].join(' '),
    [selectTime]
  )
  const formattedPlaceholder = useMemo(
    () => format(placeholderDate, dateFormat),
    [dateFormat, placeholderDate]
  )

  const [customValidity, setCustomValidity] = useState<string | undefined>(undefined)
  const [inputValue, setInputValue] = useState<string>(() =>
    value ? format(new Date(value), dateFormat) : ''
  )

  const parseInputValue = useCallback(() => {
    if (inputValue) {
      const parsed = parse(inputValue, dateFormat, new Date())
      const validDate = isValid(parsed)
      onChange(validDate ? parsed.toISOString() : null)
      setCustomValidity(validDate ? undefined : 'Invalid date')
    }
  }, [dateFormat, inputValue, onChange])

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
  }, [dateFormat, value])

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
