import {TextInput} from '@sanity/ui'
import React, {ChangeEvent, useCallback} from 'react'
import type {FilterInputTypeStringComponentProps} from '../../../config/inputTypes'

export function FieldInputString({filter, onChange}: FilterInputTypeStringComponentProps) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange(event.currentTarget.value)
    },
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
