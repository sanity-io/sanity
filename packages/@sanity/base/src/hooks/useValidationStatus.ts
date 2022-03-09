import {ValidationMarker} from '@sanity/types'
import {useMemoObservable} from 'react-rx'
import {useDatastores} from '../datastores'

interface ValidationStatus {
  isValidating: boolean
  validation: ValidationMarker[]
}

const INITIAL: ValidationStatus = {validation: [], isValidating: false}

export function useValidationStatus(publishedDocId: string, docTypeName: string): ValidationStatus {
  const {documentStore} = useDatastores()

  return useMemoObservable(
    () => documentStore.pair.validation(publishedDocId, docTypeName),
    [publishedDocId, docTypeName],
    INITIAL
  )
}
