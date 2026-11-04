import {useMemo} from 'react'
import {useSyncObservable} from 'react-rx'

import {useDocumentStore} from '../store/datastores'
import {type ValidationStatus} from '../validation'

const INITIAL: ValidationStatus = {validation: [], isValidating: false}

/** @internal */
export function useValidationStatus(
  validationTargetId: string,
  docTypeName: string,
  options?: {
    /**
     * `global` follows the document through the document preview store's shared global listener
     * instead of checking out the document pair, which opens a listener for every document
     * validated. Changes are then validated only once the server has them, so use it where nobody
     * edits the document, like a list or a board of documents. Defaults to `document`.
     */
    listener?: 'document' | 'global'
  },
): ValidationStatus

/**
 * @internal
 * @deprecated `requirePublishedReferences` is ignored: whether references must be published is
 * decided by `validationTargetId`. Leave it out, or pass `{listener}` options instead.
 */
export function useValidationStatus(
  validationTargetId: string,
  docTypeName: string,
  requirePublishedReferences: boolean,
): ValidationStatus

/** @internal */
export function useValidationStatus(
  validationTargetId: string,
  docTypeName: string,
  options?: {listener?: 'document' | 'global'} | boolean,
): ValidationStatus {
  const documentStore = useDocumentStore()
  const listener = typeof options === 'object' ? (options.listener ?? 'document') : 'document'

  const observable = useMemo(
    () => documentStore.pair.validation(validationTargetId, docTypeName, false, {listener}),
    [docTypeName, documentStore.pair, listener, validationTargetId],
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
