import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {useDocumentStore} from '../store'
import {type ValidationStatus} from '../validation'
import {useDocumentTarget} from './useDocumentTarget'

const INITIAL: ValidationStatus = {validation: [], isValidating: false}

/** @internal */
export function useValidationStatus(
  documentId: string,
  _docTypeName: string,
  requirePublishedReferences: boolean,
): ValidationStatus {
  const documentStore = useDocumentStore()
  const documentTarget = useDocumentTarget(documentId)
  const observable = useMemo(
    () => documentStore.document.validation(documentTarget, requirePublishedReferences),
    [documentTarget, documentStore.document, requirePublishedReferences],
  )

  return useObservable(observable, INITIAL)
}
