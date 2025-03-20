import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {useDocumentStore} from '../store/_legacy/datastores'
import {type ValidationStatus} from '../validation/validateDocumentWithReferences'

const INITIAL: ValidationStatus = {validation: [], isValidating: false}

/** @internal */
export function useValidationStatus(
  publishedDocId: string,
  docTypeName: string,
  version?: string,
): ValidationStatus {
  const documentStore = useDocumentStore()

  const observable = useMemo(
    () => documentStore.pair.validation(publishedDocId, docTypeName, version),
    [docTypeName, documentStore.pair, publishedDocId, version],
  )
  return useObservable(observable, INITIAL)
}
