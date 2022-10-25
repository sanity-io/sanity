import {Box, Flex, TextInput} from '@sanity/ui'
import React, {ChangeEvent, useCallback, useRef} from 'react'
import type {FilterInputTypeNumberRangeComponentProps} from '../../../config/inputTypes'

export function FieldInputNumberRange({
  filter,
  onChange,
}: FilterInputTypeNumberRangeComponentProps) {
  const numberMax = useRef<string | null>(filter?.value?.max || null)
  const numberMin = useRef<string | null>(filter?.value?.min || null)

  const handleChange = useCallback(() => {
    onChange({
      max: numberMax?.current,
      min: numberMin?.current,
    })
  }, [onChange])

  const handleMaxChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      numberMax.current = event.currentTarget.value
      handleChange()
    },
    [handleChange]
  )
  const handleMinChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      numberMin.current = event.currentTarget.value
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
          onChange={handleMinChange}
          pattern="^\d+\.?\d*$"
          placeholder="Enter value..."
          value={filter?.value?.min || ''}
        />
      </Box>
      <Box flex={1}>
        <TextInput
          fontSize={1}
          inputMode="numeric"
          onChange={handleMaxChange}
          pattern="^\d+\.?\d*$"
          placeholder="Enter value..."
          value={filter?.value?.max || ''}
        />
      </Box>
    </Flex>
  )
}
