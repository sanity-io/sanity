import React, {useCallback} from 'react'
import {OperatorInputComponentProps} from '../../../../definitions/operators'
import {ReferenceAutocomplete} from '../ReferenceAutocomplete'

export function FieldInputReference({onChange, value}: OperatorInputComponentProps<string>) {
  const handleChange = useCallback(
    (documentId: string | null) => {
      onChange(documentId)
    },
    [onChange]
  )

  return <ReferenceAutocomplete onSelect={handleChange} value={value} />
}
