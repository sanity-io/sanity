import documentStore from 'part:@sanity/base/datastore/document'
import {useObservable} from './utils/useObservable'
import React from 'react'

interface Marker {
  level: string
  type: string
}

interface ValidationStatus {
  isValidating: boolean
  markers: Marker[]
}

const INITIAL: ValidationStatus = {markers: [], isValidating: false}

export function useValidationStatus(publishedDocId, docTypeName): ValidationStatus {
  return useObservable(
    React.useMemo(() => documentStore.pair.validation(publishedDocId, docTypeName), [
      publishedDocId,
      docTypeName
    ]),
    INITIAL
  )
}
