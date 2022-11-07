import {Box, Flex, TextInput} from '@sanity/ui'
import isFinite from 'lodash/isFinite'
import React, {ChangeEvent, useCallback, useState} from 'react'
import type {
  OperatorInputComponentProps,
  OperatorNumberRangeValue,
} from '../../../../definitions/operators'

export function FieldInputNumberRange({
  onChange,
  value,
}: OperatorInputComponentProps<OperatorNumberRangeValue>) {
  const [max, setMax] = useState(value?.max ?? '')
  const [min, setMin] = useState(value?.min ?? '')

  const handleMaxChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setMax(event.currentTarget.value)
      const numValue = parseFloat(event.currentTarget.value)
      onChange({
        max: isFinite(numValue) ? numValue : null,
        min: value?.min ?? null,
      })
    },
    [value?.min, onChange]
  )
  const handleMinChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setMin(event.currentTarget.value)
      const numValue = parseFloat(event.currentTarget.value)
      onChange({
        max: value?.max ?? null,
        min: isFinite(numValue) ? numValue : null,
      })
    },
    [value?.max, onChange]
  )

  return (
    <Flex gap={2}>
      <Box flex={1}>
        <TextInput
          fontSize={1}
          onChange={handleMinChange}
          placeholder="Enter value..."
          step="any"
          type="number"
          value={min}
        />
      </Box>
      <Box flex={1}>
        <TextInput
          fontSize={1}
          onChange={handleMaxChange}
          placeholder="Enter value..."
          step="any"
          type="number"
          value={max}
        />
      </Box>
    </Flex>
  )
}
