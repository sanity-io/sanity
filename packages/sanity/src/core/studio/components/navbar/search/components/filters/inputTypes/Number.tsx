import {TextInput} from '@sanity/ui'
import isNumber from 'lodash/isNumber'
import React, {ChangeEvent, useCallback, useState} from 'react'
import type {FilterInputTypeNumberComponentProps} from '../../../config/inputTypes'

export function FieldInputNumber({filter, onChange}: FilterInputTypeNumberComponentProps) {
  const [value, setValue] = useState(filter?.value || '')

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setValue(event.currentTarget.value)
      const numValue = parseFloat(event.currentTarget.value)
      if (isNumber(numValue)) {
        onChange(numValue)
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
      value={value}
    />
  )
}
