import {CalendarIcon} from '@sanity/icons'
import {Box, Card, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {isDate} from 'lodash'
import React, {ChangeEvent, useCallback, useState} from 'react'
import type {FilterInputTypeDateRangeComponentProps} from '../../../config/inputTypes'

export function FieldInputDateRange({filter, onChange}: FilterInputTypeDateRangeComponentProps) {
  const [max, setMax] = useState(filter?.value?.max || '')
  const [min, setMin] = useState(filter?.value?.min || '')

  const handleMaxChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const newValue = event.currentTarget.value
      setMax(newValue)
      if (isDate(newValue)) {
        onChange({max: newValue, min: filter?.value?.min})
      }
    },
    [filter?.value?.min, onChange]
  )
  const handleMinChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const newValue = event.currentTarget.value
      setMin(newValue)
      if (isDate(newValue)) {
        onChange({max: filter?.value?.max, min: newValue})
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
            value={min}
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
            value={max}
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
