import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {useDocumentStore} from '../store'
import {type ValidationStatus} from '../validation'

const INITIAL: ValidationStatus = {validation: [], isValidating: false}

/** @internal */
export function useValidationStatus(
  validationTargetId: string,
  docTypeName: string,
  releaseId?: string,
): ValidationStatus {
  const documentStore = useDocumentStore()

  const observable = useMemo(
    () => documentStore.pair.validation(validationTargetId, docTypeName, releaseId),
    [docTypeName, documentStore.pair, validationTargetId, releaseId],
  )
  return useObservable(observable, INITIAL)
}
