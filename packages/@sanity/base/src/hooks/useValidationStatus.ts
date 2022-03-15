// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {Marker} from '@sanity/types'
import documentStore from 'part:@sanity/base/datastore/document'
import {useMemoObservable} from 'react-rx'

interface ValidationStatus {
  isValidating: boolean
  markers: Marker[]
}

const INITIAL: ValidationStatus = {markers: [], isValidating: false}

export function useValidationStatus(publishedDocId: string, docTypeName: string): ValidationStatus {
  return useMemoObservable(
    () => documentStore.pair.validation(publishedDocId, docTypeName),
    [publishedDocId, docTypeName],
    INITIAL
  )
}
