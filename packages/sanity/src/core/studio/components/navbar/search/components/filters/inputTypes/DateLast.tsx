import {Box, Flex, Select, TextInput} from '@sanity/ui'
import React, {ChangeEvent, useCallback, useRef} from 'react'
import type {DateLastValue, InputComponentProps} from '../../../definitions/operators/types'

export function FieldInputDateLast({filter, onChange}: InputComponentProps<DateLastValue>) {
  const dateUnit = useRef<DateLastValue['unit']>(filter?.value?.unit || null)
  const dateValue = useRef<DateLastValue['value']>(filter?.value?.value || null)

  const handleChange = useCallback(() => {
    onChange({
      unit: dateUnit?.current,
      value: dateValue?.current,
    })
  }, [onChange])

  const handleUnitChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      dateUnit.current = event.currentTarget.value as DateLastValue['unit']
      handleChange()
    },
    [handleChange]
  )
  const handleValueChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      dateValue.current = Number(event.currentTarget.value)
      handleChange()
    },
    [handleChange]
  )

  return (
    <Flex gap={2}>
      <Box flex={1}>
        <TextInput
          fontSize={1}
          onChange={handleValueChange}
          type="number"
          value={filter?.value?.value || ''}
        />
      </Box>
      <Box flex={1}>
        <Select fontSize={1} onChange={handleUnitChange} value={filter?.value?.unit}>
          <option value="days">Days</option>
          <option value="months">Months</option>
          <option value="years">Years</option>
        </Select>
      </Box>
    </Flex>
  )
}
