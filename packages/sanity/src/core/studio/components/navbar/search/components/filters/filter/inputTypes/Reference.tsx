import React, {useCallback} from 'react'
import {getPublishedId} from '../../../../../../../../util'
import {OperatorInputComponentProps} from '../../../../definitions/operators'
import {ReferenceAutocomplete} from '../ReferenceAutocomplete'

export function FieldInputReference({onChange, value}: OperatorInputComponentProps<string>) {
  const handleChange = useCallback(
    (documentId: string | null) => {
      onChange(documentId && getPublishedId(documentId))
    },
    [onChange]
  )

  return <ReferenceAutocomplete onSelect={handleChange} value={value} />
}
