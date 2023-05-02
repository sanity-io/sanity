import {useMemoObservable} from 'react-rx'
import {useDocumentStore, ValidationStatus} from '../store'

const INITIAL: ValidationStatus = {validation: [], isValidating: false}

/** @internal */
export function useValidationStatus(publishedDocId: string, docTypeName: string): ValidationStatus {
  const documentStore = useDocumentStore()

  return useMemoObservable(
    () => documentStore.pair.validation(publishedDocId, docTypeName),
    [documentStore.pair, publishedDocId, docTypeName],
    INITIAL
  )
}
