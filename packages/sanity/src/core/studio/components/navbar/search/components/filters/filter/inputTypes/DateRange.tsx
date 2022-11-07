import {CalendarIcon} from '@sanity/icons'
import {Box, Card, Flex, Stack, Text, TextInput} from '@sanity/ui'
import isDate from 'lodash/isDate'
import React, {ChangeEvent, useCallback, useState} from 'react'
import {OperatorDateRangeValue} from '../../../../definitions/operators/dateOperators'
import {OperatorInputComponentProps} from '../../../../definitions/operators/operatorTypes'

export function FieldInputDateRange({
  onChange,
  value,
}: OperatorInputComponentProps<OperatorDateRangeValue>) {
  const [max, setMax] = useState(value?.max || '')
  const [min, setMin] = useState(value?.min || '')

  const handleMaxChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const newValue = event.currentTarget.value
      setMax(newValue)
      if (isDate(newValue)) {
        onChange({max: newValue, min: value?.min ?? null})
      }
    },
    [value?.min, onChange]
  )
  const handleMinChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const newValue = event.currentTarget.value
      setMin(newValue)
      if (isDate(newValue)) {
        onChange({max: value?.max ?? null, min: newValue})
      }
    },
    [value?.max, onChange]
  )

  return (
    <Stack space={2}>
      <Flex gap={2}>
        <Box flex={1}>
          <TextInput
            fontSize={1}
            icon={CalendarIcon}
            onChange={handleMinChange}
            placeholder="Date 1"
            size={1}
            style={{minWidth: '200px'}}
            // value={min} // TODO: handle date objects with date input
          />
        </Box>
        <Box flex={1}>
          <TextInput
            fontSize={1}
            icon={CalendarIcon}
            onChange={handleMaxChange}
            placeholder="Date 2"
            size={1}
            style={{minWidth: '200px'}}
            // value={max} // TODO: handle date objects with date input
          />
        </Box>
      </Flex>
      <Card border padding={3} radius={1} tone="caution">
        <Text muted size={1}>
          TODO: use date input
        </Text>
      </Card>
    </Stack>
  )
}
