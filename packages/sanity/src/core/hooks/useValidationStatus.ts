import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {useDocumentStore} from '../store'
import {type ValidationStatus} from '../validation'

const INITIAL: ValidationStatus = {validation: [], isValidating: false}

/** @internal */
export function useValidationStatus(
  publishedDocId: string,
  docTypeName: string,
  version?: string,
  displayedDocumentId?: string,
): ValidationStatus {
  const documentStore = useDocumentStore()

  const observable = useMemo(
    () => documentStore.pair.validation(publishedDocId, docTypeName, version, displayedDocumentId),
    [docTypeName, documentStore.pair, publishedDocId, version, displayedDocumentId],
  )
  return useObservable(observable, INITIAL)
}
