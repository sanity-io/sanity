/**
 * Returns a signal that aborts, with the same reason, as soon as any of the given signals aborts.
 *
 * This is `AbortSignal.any()`, which Safari only implements from 17.4 (March 2024). Studio
 * requests that pass a signal through the concurrency limiter would otherwise throw a `TypeError`
 * in the browsers just below that line, so the native implementation is used when present and the
 * signals are composed manually when it is not.
 */
export function anySignal(signals: AbortSignal[]): AbortSignal {
  if (typeof AbortSignal.any === 'function') return AbortSignal.any(signals)

  const controller = new AbortController()
  const abortedSignal = signals.find((signal) => signal.aborted)
  if (abortedSignal) {
    controller.abort(abortedSignal.reason)
    return controller.signal
  }

  // Once the combined signal has aborted, the listeners would only keep it alive for as long as
  // the source signals live, so they are removed as soon as they have served their purpose.
  const removeListeners: Array<() => void> = []
  const abort = (reason: unknown) => {
    for (const removeListener of removeListeners) removeListener()
    controller.abort(reason)
  }
  for (const signal of signals) {
    const onAbort = () => abort(signal.reason)
    signal.addEventListener('abort', onAbort)
    removeListeners.push(() => signal.removeEventListener('abort', onAbort))
  }
  return controller.signal
}
