import {TextInput} from '@sanity/ui'
import React, {ChangeEvent, useCallback} from 'react'
import type {InputComponentProps} from '../../../definitions/operators/types'

export function FieldInputString({filter, onChange}: InputComponentProps<string>) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => onChange(event.currentTarget.value || null),
    [onChange]
  )

  return (
    <TextInput
      fontSize={1}
      onChange={handleChange}
      placeholder="Enter value..."
      value={filter?.value || ''}
    />
  )
}
