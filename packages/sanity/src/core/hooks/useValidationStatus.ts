import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {useDocumentStore} from '../store'
import {type DocumentTarget} from '../store/document/document/types'
import {type ValidationStatus} from '../validation'

const INITIAL: ValidationStatus = {validation: [], isValidating: false}

/** @internal */
export function useValidationStatus(
  validationTarget: string | DocumentTarget,
  docTypeName: string,
  requirePublishedReferences: boolean,
): ValidationStatus {
  const documentStore = useDocumentStore()
  const observable = useMemo(
    () =>
      typeof validationTarget === 'string'
        ? // Preserve original behavior if the validation target is a string
          documentStore.pair.validation(validationTarget, docTypeName, requirePublishedReferences)
        : documentStore.document.validation(validationTarget, requirePublishedReferences),
    [validationTarget, docTypeName, documentStore, requirePublishedReferences],
  )

  return useObservable(observable, INITIAL)
}
