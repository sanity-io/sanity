import {useEffect} from 'react'

import {useDocumentStore} from '../store/datastores'

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
 * `useValidationStatus`: every `useValidationStatus` of that document gets the results sooner,
 * and validation stays immediate until every caller has disabled it or unmounted.
 *
 * @beta
 */
export function useSetImmediateValidation(
  validationTargetId: string,
  docTypeName: string,
  requirePublishedReferences: boolean,
  {enabled}: {enabled: boolean},
): void {
  const documentStore = useDocumentStore()

  useEffect(() => {
    if (!enabled) return undefined
    const subscription = documentStore.pair
      .validation(validationTargetId, docTypeName, requirePublishedReferences, {
        scheduling: 'immediate',
      })
      .subscribe()
    return () => subscription.unsubscribe()
  }, [enabled, docTypeName, documentStore.pair, validationTargetId, requirePublishedReferences])
}
