import documentStore from 'part:@sanity/base/datastore/document'
import {useObservable} from './utils/use-observable'
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

export function useValidationStatus(publishedId, typeName): ValidationStatus {
  return useObservable(
    React.useMemo(() => documentStore.pair.validation(publishedId, typeName), [
      publishedId,
      typeName
    ]),
    INITIAL
  )
}
