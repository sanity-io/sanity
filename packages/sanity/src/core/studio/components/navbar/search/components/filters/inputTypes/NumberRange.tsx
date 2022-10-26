import {Box, Flex, TextInput} from '@sanity/ui'
import isNumber from 'lodash/isNumber'
import React, {ChangeEvent, useCallback, useState} from 'react'
import type {FilterInputTypeNumberRangeComponentProps} from '../../../config/inputTypes'

export function FieldInputNumberRange({
  filter,
  onChange,
}: FilterInputTypeNumberRangeComponentProps) {
  const [max, setMax] = useState(filter?.value?.max || '')
  const [min, setMin] = useState(filter?.value?.min || '')

  const handleMaxChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setMax(event.currentTarget.value)
      const numValue = parseFloat(event.currentTarget.value)
      if (isNumber(numValue)) {
        onChange({max: numValue, min: filter?.value?.min})
      }
    },
    [filter?.value?.min, onChange]
  )
  const handleMinChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setMin(event.currentTarget.value)
      const numValue = parseFloat(event.currentTarget.value)
      if (isNumber(numValue)) {
        onChange({max: filter?.value?.max, min: numValue})
      }
    },
    [filter?.value?.max, onChange]
  )

  return (
    <Flex gap={2}>
      <Box flex={1}>
        <TextInput
          fontSize={1}
          inputMode="numeric"
          onChange={handleMinChange}
          pattern="^\d+\.?\d*$"
          placeholder="Enter value..."
          value={min}
        />
      </Box>
      <Box flex={1}>
        <TextInput
          fontSize={1}
          inputMode="numeric"
          onChange={handleMaxChange}
          pattern="^\d+\.?\d*$"
          placeholder="Enter value..."
          value={max}
        />
      </Box>
    </Flex>
  )
}
