import {useMemo} from 'react'
import {useSyncObservable} from 'react-rx'

import {useDocumentStore} from '../store/datastores'
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

  // Kept synchronous: consumers use this as a write-side gate, not just for
  // display. PublishAction enables publish from `hasValidationErrors` and
  // fires `doPublish()` once `isValidating` is false and `revision` matches
  // the live edit revision — and reference-driven revalidation re-runs
  // validation without changing the document revision, so a deferred (stale
  // but revision-matching) "valid" snapshot could publish before live errors
  // catch up. Identity-coherent deferral cannot help there: the observable
  // identity is stable while the pane is mounted; only the value lags.
  // Proof: hooks/__tests__/useValidationStatus.test.tsx.
  return useSyncObservable(observable, INITIAL)
}
