import React from 'react'
import {Marker} from '@sanity/types'
import documentStore from 'part:@sanity/base/datastore/document'
import {useObservable} from './utils/useObservable'

interface ValidationStatus {
  isValidating: boolean
  markers: Marker[]
}

const INITIAL: ValidationStatus = {markers: [], isValidating: false}

export function useValidationStatus(publishedDocId: string, docTypeName: string): ValidationStatus {
  return useObservable(
    React.useMemo(() => documentStore.pair.validation(publishedDocId, docTypeName), [
      publishedDocId,
      docTypeName,
    ]),
    INITIAL
  )
}
