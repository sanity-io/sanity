import {Box, Flex, Select, TextInput} from '@sanity/ui'
import React, {ChangeEvent, useCallback, useRef} from 'react'
import type {FilterInputTypeDateLastComponentProps} from '../../../config/inputTypes'

export function FieldInputDateLast({filter, onChange}: FilterInputTypeDateLastComponentProps) {
  const dateUnit = useRef<string | null>(filter?.value?.unit || null)
  const dateValue = useRef<string | null>(filter?.value?.value || null)

  const handleChange = useCallback(() => {
    onChange({
      unit: dateUnit?.current,
      value: dateValue?.current,
    })
  }, [onChange])

  const handleUnitChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      dateUnit.current = event.currentTarget.value
      handleChange()
    },
    [handleChange]
  )
  const handleValueChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      dateValue.current = event.currentTarget.value
      handleChange()
    },
    [handleChange]
  )

  return (
    <Flex gap={2}>
      <Box flex={1}>
        <TextInput
          fontSize={1}
          inputMode="numeric"
          onChange={handleValueChange}
          pattern="^\d+\.?\d*$"
          placeholder="Enter value..."
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
