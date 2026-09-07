/**
 * Ponyfill for `AbortSignal.any`. Uses the native static where it exists and falls back to a
 * listener-based implementation on Safari 17.0–17.3, which shipped without it.
 *
 * The fallback removes its listeners from the source signals once one of them aborts, and
 * otherwise leaves them in place for the lifetime of the sources, the same way `any-signal`
 * does. Runtimes with the native static keep its weak-reference semantics.
 */
export function anySignal(signals: AbortSignal[]): AbortSignal {
  if (typeof AbortSignal.any === 'function') return AbortSignal.any(signals)

  const controller = new AbortController()
  const cleanups: Array<() => void> = []
  const abort = (reason: unknown) => {
    for (const cleanup of cleanups) cleanup()
    controller.abort(reason)
  }

  for (const signal of signals) {
    if (signal.aborted) {
      abort(signal.reason)
      break
    }
    const onAbort = () => abort(signal.reason)
    signal.addEventListener('abort', onAbort, {once: true})
    cleanups.push(() => signal.removeEventListener('abort', onAbort))
  }

  return controller.signal
}
