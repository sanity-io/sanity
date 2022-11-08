import React, {useCallback} from 'react'
import {getPublishedId} from '../../../../../../../../util'
import {ReferenceAutocomplete} from '../ReferenceAutocomplete'
import {OperatorInputComponentProps} from '../../../../definitions/operators/operatorTypes'

export function FieldInputReference({onChange, value}: OperatorInputComponentProps<string>) {
  const handleChange = useCallback(
    (documentId: string | null) => {
      onChange(documentId && getPublishedId(documentId))
    },
    [onChange]
  )

  return <ReferenceAutocomplete onSelect={handleChange} value={value} />
}
