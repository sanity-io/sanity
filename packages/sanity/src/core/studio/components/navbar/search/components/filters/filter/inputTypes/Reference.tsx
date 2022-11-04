import React, {useCallback} from 'react'
import type {InputComponentProps} from '../../../../definitions/operators/types'
import {ReferenceAutocomplete} from '../ReferenceAutocomplete'

export function FieldInputReference({filter, onChange}: InputComponentProps<string>) {
  const handleChange = useCallback(
    (documentId: string | null) => {
      onChange(documentId)
    },
    [onChange]
  )

  return <ReferenceAutocomplete onSelect={handleChange} value={filter?.value} />
}
