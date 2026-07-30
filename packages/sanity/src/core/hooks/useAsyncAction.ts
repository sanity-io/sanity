import {useCallback, useRef, useState} from 'react'

/**
 * Runs an async side-effect at most once per invocation, guarding against re-entry and exposing an
 * `isRunning` flag for UI (button loading / disabled).
 *
 * Why a ref and not just state: `setIsRunning(true)` — and therefore any `disabled={isRunning}` on a
 * button — only takes effect after a re-render, so two calls dispatched in the same tick (a fast
 * double-click, or two events before React flushes) would both pass a state check and run the effect
 * twice. `isRunningRef` flips synchronously, so the second call is rejected on the same tick.
 *
 * The callback owns its own success / result handling (toasts, closing, clearing selection); this
 * hook only manages the run lifecycle. A thrown (or rejected) error is routed to `options.onError`
 * and swallowed, so the returned `run` never rejects and `isRunning` is always released.
 *
 * @internal
 */
export function useAsyncAction<Args extends unknown[]>(
  fn: (...args: Args) => Promise<void>,
  options?: {onError?: (error: unknown) => void},
): {run: (...args: Args) => Promise<void>; isRunning: boolean} {
  const [isRunning, setIsRunning] = useState(false)
  // Synchronous re-entry guard — see the note above on why state alone is insufficient.
  const isRunningRef = useRef(false)
  const onError = options?.onError

  const run = useCallback(
    (...args: Args): Promise<void> => {
      if (isRunningRef.current) return Promise.resolve()
      isRunningRef.current = true
      setIsRunning(true)
      // Promise chain rather than try/catch/finally: keeps the run lifecycle clean under the React
      // Compiler and still catches a synchronous throw from `fn` (via Promise.resolve().then).
      return Promise.resolve()
        .then(() => fn(...args))
        .catch((error) => {
          onError?.(error)
        })
        .finally(() => {
          isRunningRef.current = false
          setIsRunning(false)
        })
    },
    [fn, onError],
  )

  return {run, isRunning}
}
