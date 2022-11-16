import {TextInput} from '@sanity/ui'
import React, {ChangeEvent, useCallback} from 'react'
import {OperatorInputComponentProps} from '../../../../definitions/operators/operatorTypes'

export function FieldInputString({onChange, value}: OperatorInputComponentProps<number | string>) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => onChange(event.currentTarget.value || null),
    [onChange]
  )

  return (
    <TextInput
      fontSize={1}
      onChange={handleChange}
      placeholder="Enter value..."
      value={value || ''}
    />
  )
}
