/**
 * Handles failures of requests made by a store. A store hands a request
 * over to this handler when a failure would leave it with no way to
 * recover locally — instead of letting the failure error its streams.
 *
 * @internal
 */
export interface StoreRequestErrorHandler {
  /**
   * Runs `thunk` and takes responsibility for its failures. An
   * implementation may recover by re-invoking the thunk — the returned
   * promise resolves with the first successful attempt. Failures the
   * handler cannot take responsibility for reject the returned promise.
   *
   * `retryable: true` is the store's assertion that the request is
   * idempotent and safe to re-run.
   */
  attempt<T>(thunk: () => Promise<T>, options?: {retryable?: boolean}): Promise<T>
}
