import {ValidationMarker} from '@sanity/types'
import {useMemoObservable} from 'react-rx'
import {useDocumentStore} from '../../_unstable/datastores'

export interface ValidationStatus {
  isValidating: boolean
  validation: ValidationMarker[]
  revision?: string
}

const INITIAL: ValidationStatus = {validation: [], isValidating: false}

export function useValidationStatus(publishedDocId: string, docTypeName: string): ValidationStatus {
  const documentStore = useDocumentStore()

  return useMemoObservable(
    () => documentStore.pair.validation(publishedDocId, docTypeName),
    [publishedDocId, docTypeName],
    INITIAL
  )
}
