import {useEffect} from 'react'

import {useDocumentStore} from '../store/datastores'
import {type ValidationListener} from '../store/document/document-pair/validation'

/**
 * Validates a document without waiting for idle time, for as long as `enabled` is true, including
 * a validation already in progress. Meant for the moment a user is waiting on the result, such as
 * a publish that waits for validation to finish.
 *
 * This can hurt the studio's responsiveness. While it is enabled, every validation of the document,
 * including the ones later edits start, competes with rendering and input for the main thread.
 * Validation still hands the thread back to the browser now and then, but on a large document
 * typing and scrolling can feel sluggish until it is done. Enable it only while someone is
 * waiting, and disable it as soon as they no longer are.
 *
 * It switches the document's shared validation, so pass the same arguments as
 * `useValidationStatus`, its `listener` included: every `useValidationStatus` of that document
 * and listener gets the results sooner, and validation stays immediate until every caller has
 * disabled it or unmounted. It reports no errors itself: if the document's validation fails, the
 * hold ends, and `useValidationStatus` reports the failure.
 *
 * Each listener validates the document on its own, so a hold only speeds up the validation of its
 * own `listener`: one with the default, `document`, leaves a
 * `useValidationStatus(id, type, {listener: 'global'})` validating in idle time, and the other way
 * around. A hold on a listener that no `useValidationStatus` reads validates through it anyway,
 * and with `document` that checks out the document pair.
 *
 * @beta
 */
export function useSetImmediateValidation(
  validationTargetId: string,
  docTypeName: string,
  /**
   * @deprecated Ignored. Whether references must be published is decided by `validationTargetId`.
   */
  _requirePublishedReferences: boolean,
  {
    enabled,
    listener = 'document',
  }: {
    enabled: boolean
    /**
     * The `listener` of the `useValidationStatus` to speed up. Defaults to `document`.
     */
    listener?: ValidationListener
  },
): void {
  const documentStore = useDocumentStore()

  useEffect(() => {
    if (!enabled) return undefined
    const subscription = documentStore.pair
      .validation(validationTargetId, docTypeName, false, {scheduling: 'immediate', listener})
      // `useValidationStatus` already reports a failure; reporting it here too would duplicate it
      .subscribe({error: () => undefined})
    return () => subscription.unsubscribe()
  }, [enabled, docTypeName, documentStore.pair, listener, validationTargetId])
}
