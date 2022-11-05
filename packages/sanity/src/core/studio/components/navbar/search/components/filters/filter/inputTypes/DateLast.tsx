import {Box, Flex, Select, TextInput} from '@sanity/ui'
import React, {ChangeEvent, useCallback, useRef} from 'react'
import {OperatorDateLastValue, OperatorInputComponentProps} from '../../../../definitions/operators'

export function FieldInputDateLast({
  onChange,
  value,
}: OperatorInputComponentProps<OperatorDateLastValue>) {
  const dateUnit = useRef<OperatorDateLastValue['unit']>('days')
  const dateValue = useRef<OperatorDateLastValue['value']>(value?.value || null)

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
          value={value?.value || ''}
        />
      </Box>
      <Box flex={1}>
        <Select fontSize={1} onChange={handleUnitChange} value={value?.unit}>
          <option value="days">Days</option>
          <option value="months">Months</option>
          <option value="years">Years</option>
        </Select>
      </Box>
    </Flex>
  )
}
