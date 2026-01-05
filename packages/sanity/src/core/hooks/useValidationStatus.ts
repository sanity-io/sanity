import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {useDocumentStore} from '../store'
import {type ValidationStatus} from '../validation'

const INITIAL: ValidationStatus = {validation: [], isValidating: false}

/** @internal */
export function useValidationStatus(
  validationTargetId: string,
  docTypeName: string,
  requirePublishedReferences: boolean,
): ValidationStatus {
  const documentStore = useDocumentStore()

  const observable = useMemo(
    () =>
      documentStore.pair.validation(validationTargetId, docTypeName, requirePublishedReferences),
    [docTypeName, documentStore.pair, validationTargetId, requirePublishedReferences],
  )

  return useObservable(observable, INITIAL)
}
