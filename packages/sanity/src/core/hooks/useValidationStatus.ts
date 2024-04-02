import {useMemoObservable} from 'react-rx'

import {useDocumentStore} from '../store/_legacy/datastores'
import {type ValidationStatus} from '../store/_legacy/document/document-pair/validation'

const INITIAL: ValidationStatus = {validation: [], isValidating: false}

/** @internal */
export function useValidationStatus(publishedDocId: string, docTypeName: string): ValidationStatus {
  const documentStore = useDocumentStore()

  return useMemoObservable(
    () => documentStore.pair.validation(publishedDocId, docTypeName),
    [documentStore.pair, publishedDocId, docTypeName],
    INITIAL,
  )
}
