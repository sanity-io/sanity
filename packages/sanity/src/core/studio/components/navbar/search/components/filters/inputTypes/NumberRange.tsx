import {Box, Flex, TextInput} from '@sanity/ui'
import isNumber from 'lodash/isNumber'
import React, {ChangeEvent, useCallback, useState} from 'react'
import type {InputComponentProps, NumberRangeValue} from '../../../definitions/operators/types'

export function FieldInputNumberRange({filter, onChange}: InputComponentProps<NumberRangeValue>) {
  const [max, setMax] = useState(filter?.value?.max || '')
  const [min, setMin] = useState(filter?.value?.min || '')

  const handleMaxChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setMax(event.currentTarget.value)
      const numValue = parseFloat(event.currentTarget.value)
      if (isNumber(numValue)) {
        onChange({max: numValue, min: filter?.value?.min ?? null})
      }
    },
    [filter?.value?.min, onChange]
  )
  const handleMinChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setMin(event.currentTarget.value)
      const numValue = parseFloat(event.currentTarget.value)
      if (isNumber(numValue)) {
        onChange({max: filter?.value?.max ?? null, min: numValue})
      }
    },
    [filter?.value?.max, onChange]
  )

  return (
    <Flex gap={2}>
      <Box flex={1}>
        <TextInput
          fontSize={1}
          onChange={handleMinChange}
          placeholder="Enter value..."
          type="number"
          value={min}
        />
      </Box>
      <Box flex={1}>
        <TextInput
          fontSize={1}
          onChange={handleMaxChange}
          placeholder="Enter value..."
          type="number"
          value={max}
        />
      </Box>
    </Flex>
  )
}
