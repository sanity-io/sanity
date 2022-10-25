import {TextInput} from '@sanity/ui'
import React, {ChangeEvent, useCallback} from 'react'
import type {FilterInputTypeNumberComponentProps} from '../../../config/inputTypes'

export function FieldInputNumber({filter, onChange}: FilterInputTypeNumberComponentProps) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (event.currentTarget.value) {
        onChange(event.currentTarget.value)
      }
    },
    [onChange]
  )

  return (
    <TextInput
      fontSize={1}
      inputMode="numeric"
      onChange={handleChange}
      pattern="^\d+\.?\d*$"
      placeholder="Enter value..."
      value={filter?.value || ''}
    />
  )
}
