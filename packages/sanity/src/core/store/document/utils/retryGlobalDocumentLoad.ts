import {type MonoTypeOperatorFunction, retry, timer} from 'rxjs'

// Same limit as the preview store's document-count fetch. An unbounded retry would never surface
// the failure.
const MAX_GLOBAL_DOCUMENT_LOAD_RETRIES = 3

/**
 * Retries a document followed through the global listener (`unstable_observeDocument`) after a
 * failed fetch or a dropped listener, three times with a growing delay, then lets the error
 * through. Hooks rethrow an errored stream during render, so a transient failure must not reach
 * them.
 *
 * @internal
 */
export function retryGlobalDocumentLoad<T>(): MonoTypeOperatorFunction<T> {
  return retry({
    count: MAX_GLOBAL_DOCUMENT_LOAD_RETRIES,
    delay: (_error: unknown, attempt) => timer(Math.min(30_000, attempt * 1000)),
  })
}
