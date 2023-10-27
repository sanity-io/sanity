import React, {FormEvent, useCallback, useRef, useState} from 'react'
import {Box, Card, Label, Stack, TextInput} from '@sanity/ui'

interface LinkEditFormProps {
  value?: string
  onChange?: (value?: string) => void
}

export function LinkEditForm(props: LinkEditFormProps) {
  const {value: valueFromProps, onChange} = props
  const [value, setValue] = useState(valueFromProps)
  const inputField = useRef<HTMLInputElement | null>(null)

  const handleChange = useCallback(
    (event: FormEvent<HTMLInputElement>): void => {
      setValue(event.currentTarget.value)
      if (onChange) {
        onChange(value)
      }
    },
    [onChange, value],
  )

  return (
    <Card padding={2} tone="default" border>
      <Stack space={2}>
        <Label size={0}>{value ? 'Edit' : 'Create'} link</Label>
        <Box overflow="auto">
          <TextInput ref={inputField} value={value} onChange={handleChange} />
        </Box>
      </Stack>
    </Card>
  )
}
