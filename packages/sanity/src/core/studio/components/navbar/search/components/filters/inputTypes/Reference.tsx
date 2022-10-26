import React, {useCallback} from 'react'
import type {FilterInputTypeReferenceComponentProps} from '../../../config/inputTypes'
import {ReferenceAutocomplete} from '../compound/ReferenceAutocomplete'

export function FieldInputReference({filter, onChange}: FilterInputTypeReferenceComponentProps) {
  const handleChange = useCallback(
    (documentId: string | null) => {
      onChange(documentId)
    },
    [onChange]
  )

  return <ReferenceAutocomplete onSelect={handleChange} value={filter?.value} />
}
