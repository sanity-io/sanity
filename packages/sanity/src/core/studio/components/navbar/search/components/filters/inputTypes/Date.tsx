import {CalendarIcon} from '@sanity/icons'
import {Card, Stack, Text, TextInput} from '@sanity/ui'
import React, {ChangeEvent, useCallback} from 'react'
import type {FilterInputTypeDateComponentProps} from '../../../config/inputTypes'

export function FieldInputDate({filter, onChange}: FilterInputTypeDateComponentProps) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      // onChange(event.currentTarget.value)
    },
    [onChange]
  )

  return (
    <Stack space={2}>
      <TextInput
        fontSize={1}
        icon={CalendarIcon}
        onChange={handleChange}
        placeholder="Enter or select date"
        value={filter?.value || ''}
      />
      <Card border padding={3} radius={1} tone="caution">
        <Text muted size={1}>
          TODO: use date input
        </Text>
      </Card>
    </Stack>
  )
}
