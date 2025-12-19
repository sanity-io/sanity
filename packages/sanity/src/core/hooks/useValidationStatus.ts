import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {useDocumentStore} from '../store'
import {type ValidationStatus} from '../validation'

const INITIAL: ValidationStatus = {validation: [], isValidating: false}

/** @internal */
export function useValidationStatus(
  validationTargetId: string,
  docTypeName: string,
  requireReferenceExistence: boolean,
): ValidationStatus {
  const documentStore = useDocumentStore()

  const observable = useMemo(
    () => documentStore.pair.validation(validationTargetId, docTypeName, requireReferenceExistence),
    [docTypeName, documentStore.pair, validationTargetId, requireReferenceExistence],
  )

  return useObservable(observable, INITIAL)
}
