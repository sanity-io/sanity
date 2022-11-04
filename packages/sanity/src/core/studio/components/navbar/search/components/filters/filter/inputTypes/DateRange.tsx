import {CalendarIcon} from '@sanity/icons'
import {Box, Card, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {isDate} from 'lodash'
import React, {ChangeEvent, useCallback, useState} from 'react'
import type {DateRangeValue, InputComponentProps} from '../../../../definitions/operators/types'

export function FieldInputDateRange({filter, onChange}: InputComponentProps<DateRangeValue>) {
  const [max, setMax] = useState(filter?.value?.max || '')
  const [min, setMin] = useState(filter?.value?.min || '')

  const handleMaxChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const newValue = event.currentTarget.value
      setMax(newValue)
      if (isDate(newValue)) {
        onChange({max: newValue, min: filter?.value?.min ?? null})
      }
    },
    [filter?.value?.min, onChange]
  )
  const handleMinChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const newValue = event.currentTarget.value
      setMin(newValue)
      if (isDate(newValue)) {
        onChange({max: filter?.value?.max ?? null, min: newValue})
      }
    },
    [filter?.value?.max, onChange]
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
