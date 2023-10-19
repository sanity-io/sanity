import {hues} from '@sanity/color'
import {ErrorOutlineIcon} from '@sanity/icons'
import {Flex, Text, Theme} from '@sanity/ui'
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
import styled, {css} from 'styled-components'
import {CustomTextInput} from '../../../../common/CustomTextInput'
import {Tooltip} from '../../../../../../../../../../ui'
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

const FORMAT: Record<
  'date' | 'datetime',
  {
    /** Displayed in validation errors */
    exampleDate: string
    pattern: string
  }
> = {
  date: {
    exampleDate: 'Jan 1, 2000',
    pattern: 'MMM d, yyyy',
  },
  datetime: {
    exampleDate: 'Jan 1, 2000 12:00 AM',
    pattern: 'MMM d, yyyy p',
  },
}

const Emphasis = styled.span(({theme}: {theme: Theme}) => {
  return css`
    font-weight: ${theme.sanity.fonts.text.weights.medium};
  `
})

const IconTextCritical = styled(Text)`
  color: ${hues.red[500].hex};
`

export function ParsedDateTextInput({
  isDateTime,
  onChange,
  placeholderDate,
  isDateTimeFormat,
  value,
  ...rest
}: ParsedDateTextInputProps) {
  const dateFormat = useMemo(
    () => (isDateTimeFormat ? FORMAT.datetime.pattern : FORMAT.date.pattern),
    [isDateTimeFormat],
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
    [dateFormat, isDateTime, onChange],
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
    [inputValue, processInputString],
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
    <Tooltip
      content={
        <Flex gap={2}>
          <IconTextCritical size={1}>
            <ErrorOutlineIcon />
          </IconTextCritical>
          <Text muted size={1}>
            Must be in the format{' '}
            <Emphasis>
              {isDateTimeFormat ? FORMAT.datetime.exampleDate : FORMAT.date.exampleDate}
            </Emphasis>
          </Text>
        </Flex>
      }
      disabled={!customValidity}
      padding={3}
      placement="top"
      portal
    >
      {/* HACK: Wrapping element required for <Tooltip> to function */}
      <div>
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
      </div>
    </Tooltip>
  )
}
