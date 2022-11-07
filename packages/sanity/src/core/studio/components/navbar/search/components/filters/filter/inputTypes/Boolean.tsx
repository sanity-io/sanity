import {Select} from '@sanity/ui'
import React, {ChangeEvent, useCallback} from 'react'
import {OperatorInputComponentProps} from '../../../../definitions/operators/operatorTypes'

export function FieldInputBoolean({onChange, value}: OperatorInputComponentProps<boolean>) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      onChange(event.currentTarget.value === 'true')
    },
    [onChange]
  )

  return (
    <Select fontSize={1} onChange={handleChange} value={String(value ?? true)}>
      <option value="true">True</option>
      <option value="false">False</option>
    </Select>
  )
}
