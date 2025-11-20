import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {useDocumentStore} from '../store'
import {type ValidationStatus} from '../validation'

const INITIAL: ValidationStatus = {validation: [], isValidating: false}

/** @internal */
export function useValidationStatus(
  publishedDocId: string,
  docTypeName: string,
  displayedDocumentId: string,
  releaseId?: string,
): ValidationStatus {
  const documentStore = useDocumentStore()

  const observable = useMemo(
    () =>
      documentStore.pair.validation(publishedDocId, docTypeName, displayedDocumentId, releaseId),
    [docTypeName, documentStore.pair, publishedDocId, displayedDocumentId, releaseId],
  )
  return useObservable(observable, INITIAL)
}
