import {TextInput} from '@sanity/ui'
import isNumber from 'lodash/isNumber'
import React, {ChangeEvent, useCallback, useState} from 'react'
import type {OperatorInputComponentProps} from '../../../../definitions/operators'

export function FieldInputNumber({value, onChange}: OperatorInputComponentProps<number>) {
  const [uncontrolledValue, setUncontrolledValue] = useState<string>(String(value) || '')

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setUncontrolledValue(event.currentTarget.value)
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
      value={uncontrolledValue}
    />
  )
}
