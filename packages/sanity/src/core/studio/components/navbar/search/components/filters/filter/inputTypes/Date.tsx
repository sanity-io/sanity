import {Stack} from '@sanity/ui'
import {format, isValid, parse} from 'date-fns'
import React, {ChangeEvent, KeyboardEvent, useCallback, useEffect, useMemo, useState} from 'react'
import {DatePicker} from '../../../../../../../../form/inputs/DateInputs/base/DatePicker'
import {OperatorInputComponentProps} from '../../../../definitions/operators/operatorTypes'
import {CustomTextInput} from '../../../common/CustomTextInput'

const DEFAULT_DATE_FORMAT = 'yyyy-MM-dd'
// const DEFAULT_TIME_FORMAT = 'HH:mm'

export function FieldInputDate({onChange, value}: OperatorInputComponentProps<Date>) {
  const [customValidity, setCustomValidity] = useState<string | undefined>(undefined)
  const [inputValue, setInputValue] = useState<string>(() =>
    value ? format(value, DEFAULT_DATE_FORMAT) : ''
  )

  const handleDatePickerChange = useCallback(
    (date: Date | null) => {
      onChange(date)
    },
    [onChange]
  )

  const parseInputValue = useCallback(() => {
    if (inputValue) {
      const parsed = parse(inputValue, DEFAULT_DATE_FORMAT, new Date())
      const validDate = isValid(parsed)
      onChange(validDate ? parsed : null)
      setCustomValidity(validDate ? undefined : 'Invalid date')
    }
  }, [inputValue, onChange])

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
    if (value && isValid(value)) {
      setInputValue(format(value, DEFAULT_DATE_FORMAT))
      setCustomValidity(undefined)
    }
  }, [value])

  const placeholderDate = useMemo(() => format(new Date(), DEFAULT_DATE_FORMAT), [])

  return (
    <Stack space={2}>
      <CustomTextInput
        clearButton={!!inputValue}
        customValidity={customValidity}
        fontSize={1}
        onBlur={handleTextInputBlur}
        onChange={handleTextInputChange}
        onClear={handleTextInputClear}
        onKeyDown={handleTextInputKeyDown}
        placeholder={`e.g. ${placeholderDate}`}
        value={inputValue}
      />
      <DatePicker onChange={handleDatePickerChange} selectTime value={value || new Date()} />
    </Stack>
  )
}
