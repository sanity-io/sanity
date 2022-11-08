import {TextInput} from '@sanity/ui'
import React, {ChangeEvent, useCallback, useState} from 'react'
import {OperatorInputComponentProps} from '../../../../definitions/operators/operatorTypes'

export function FieldInputNumber({value, onChange}: OperatorInputComponentProps<number>) {
  const [uncontrolledValue, setUncontrolledValue] = useState(value ?? '')

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setUncontrolledValue(event.currentTarget.value)
      const numValue = parseFloat(event.currentTarget.value)
      onChange(Number.isFinite(numValue) ? numValue : null)
    },
    [onChange]
  )

  return (
    <TextInput
      fontSize={1}
      onChange={handleChange}
      placeholder="Enter value..."
      step="any"
      type="number"
      value={uncontrolledValue}
    />
  )
}
