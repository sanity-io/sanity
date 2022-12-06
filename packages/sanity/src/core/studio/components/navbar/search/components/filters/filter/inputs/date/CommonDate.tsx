import {Stack} from '@sanity/ui'
import {format, isValid, parse} from 'date-fns'
import React, {ChangeEvent, KeyboardEvent, useCallback, useEffect, useMemo, useState} from 'react'
import {useSearchState} from '../../../../../contexts/search/useSearchState'
import type {OperatorInputComponentProps} from '../../../../../definitions/operators/operatorTypes'
import {CustomTextInput} from '../../../../common/CustomTextInput'
import {DatePicker} from './datePicker/DatePicker'

const DEFAULT_DATE_FORMAT = 'yyyy-MM-dd'
const DEFAULT_TIME_FORMAT = 'HH:mm'

export function CommonDateInput({
  onChange,
  selectTime,
  value,
}: OperatorInputComponentProps<string> & {
  selectTime?: boolean
}) {
  const dateFormat = useMemo(
    () => [DEFAULT_DATE_FORMAT, ...(selectTime ? [DEFAULT_TIME_FORMAT] : [])].join(' '),
    [selectTime]
  )

  const {
    state: {fullscreen},
  } = useSearchState()

  const [customValidity, setCustomValidity] = useState<string | undefined>(undefined)
  const [inputValue, setInputValue] = useState<string>(() =>
    value ? format(new Date(value), dateFormat) : ''
  )

  const handleDatePickerChange = useCallback(
    (date: Date | null) => {
      const timestamp = date?.toISOString()
      if (timestamp) {
        onChange(timestamp)
      }
    },
    [onChange]
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
    }
  }, [dateFormat, value])

  const placeholderDate = useMemo(() => format(new Date(), dateFormat), [dateFormat])

  return (
    <Stack space={3}>
      <CustomTextInput
        aria-label="Date"
        clearButton={!!inputValue}
        customValidity={customValidity}
        fontSize={fullscreen ? 2 : 1}
        onBlur={handleTextInputBlur}
        onChange={handleTextInputChange}
        onClear={handleTextInputClear}
        onKeyDown={handleTextInputKeyDown}
        placeholder={`Example: ${placeholderDate}`}
        value={inputValue}
      />
      <DatePicker
        onChange={handleDatePickerChange}
        selectTime={selectTime}
        value={value ? new Date(value) : undefined}
      />
    </Stack>
  )
}
