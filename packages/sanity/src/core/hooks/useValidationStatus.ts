import {useMemo} from 'react'

import {useDocumentStore} from '../store/datastores'
import {useDeferredObservableValue} from '../util/useDeferredObservableValue'
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

  return useDeferredObservableValue(observable, INITIAL)
}
