import {Select} from '@sanity/ui'
import React, {ChangeEvent, useCallback} from 'react'
import type {FilterInputTypeBooleanComponentProps} from '../../../config/inputTypes'

export function FieldInputBoolean({filter, onChange}: FilterInputTypeBooleanComponentProps) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      onChange(event.currentTarget.value === 'true')
    },
    [onChange]
  )

  return (
    <Select fontSize={1} onChange={handleChange} value={String(filter?.value ?? true)}>
      <option value="true">True</option>
      <option value="false">False</option>
    </Select>
  )
}
