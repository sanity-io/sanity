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
 * `useValidationStatus`: every `useValidationStatus` that reads the same validation gets the
 * results sooner, and validation stays immediate until every caller has disabled it or unmounted.
 * It reports no errors itself: if the document's validation fails, the hold ends, and
 * `useValidationStatus` reports the failure.
 *
 * The document is validated once for the checked out pair and once for the global listener, and
 * a hold speeds up the one its `listener` reads. With the default, `auto`, that is the pair's
 * while the pair is checked out, which `document` reads too, and the global listener's
 * otherwise, which `global` reads too. A hold with `document` checks out the document pair.
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
    listener = 'auto',
  }: {
    enabled: boolean
    /**
     * The `listener` of the `useValidationStatus` to speed up. Defaults to `auto`.
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
