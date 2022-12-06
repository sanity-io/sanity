import {Box, Flex, Select, TextInput} from '@sanity/ui'
import React, {ChangeEvent, useCallback, useRef, useState} from 'react'
import {useSearchState} from '../../../../../contexts/search/useSearchState'
import {OperatorDateLastValue} from '../../../../../definitions/operators/dateOperators'
import {OperatorInputComponentProps} from '../../../../../definitions/operators/operatorTypes'

export function SearchFilterDateLastInput({
  onChange,
  value,
}: OperatorInputComponentProps<OperatorDateLastValue>) {
  const [uncontrolledValue, setUncontrolledValue] = useState(value?.value || '')
  const dateUnit = useRef<OperatorDateLastValue['unit']>('days')
  const dateValue = useRef<OperatorDateLastValue['value']>(value?.value || null)

  const {
    state: {fullscreen},
  } = useSearchState()

  const handleChange = useCallback(() => {
    onChange({
      unit: dateUnit?.current,
      value: dateValue?.current,
    })
  }, [onChange])

  const handleUnitChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      dateUnit.current = event.currentTarget.value as OperatorDateLastValue['unit']
      handleChange()
    },
    [handleChange]
  )
  const handleValueChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setUncontrolledValue(event.currentTarget.value)
      const numValue = parseFloat(event.currentTarget.value)
      dateValue.current = Number.isFinite(numValue) ? numValue : null
      handleChange()
    },
    [handleChange]
  )

  return (
    <Flex gap={2}>
      <Box flex={1}>
        <TextInput
          aria-label="Unit value"
          fontSize={fullscreen ? 2 : 1}
          onChange={handleValueChange}
          pattern="\d*"
          step="1"
          type="number"
          value={uncontrolledValue}
        />
      </Box>
      <Box flex={1}>
        <Select
          aria-label="Select unit"
          fontSize={fullscreen ? 2 : 1}
          onChange={handleUnitChange}
          value={value?.unit}
        >
          <option value="days">Days</option>
          <option value="months">Months</option>
          <option value="years">Years</option>
        </Select>
      </Box>
    </Flex>
  )
}
