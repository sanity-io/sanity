import {TextInput} from '@sanity/ui'
import isNumber from 'lodash/isNumber'
import React, {ChangeEvent, useCallback, useState} from 'react'
import type {InputComponentProps} from '../../../definitions/operators/types'

export function FieldInputNumber({filter, onChange}: InputComponentProps<number>) {
  const [value, setValue] = useState<string>(String(filter?.value) || '')

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
      onChange={handleChange}
      placeholder="Enter value..."
      type="number"
      value={value}
    />
  )
}
