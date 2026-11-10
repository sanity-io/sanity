import {type ComponentType, lazy} from 'react'

/**
 * A `lazy()` component whose failed import can be tried again. React keeps a rejected `lazy()`
 * for good, so `retry` (for the error boundary's Retry) swaps in a fresh one. The rejected one
 * stays until then: swapped as soon as the import fails, the Suspense boundary's next render
 * would start another import instead of surfacing the error, so a chunk that keeps failing
 * would be fetched over and over and never reach the error boundary.
 */
export function createRetryableLazy<Props extends object>(
  load: () => Promise<{default: ComponentType<Props>}>,
): {Component: ComponentType<Props>; retry: () => void} {
  let failed = false
  const attempt = () =>
    load().catch((error: unknown) => {
      failed = true
      throw error
    })
  // Capitalized and rendered as it is: the React Compiler inlines a capitalized alias of a
  // lowercase variable back to that variable, which JSX then takes for an HTML element
  let LazyComponent = lazy(attempt)

  // A component of its own, so the lazy component is read at render time rather than captured
  function RetryableLazy(props: Props) {
    return <LazyComponent {...props} />
  }

  return {
    Component: RetryableLazy,
    retry: () => {
      if (!failed) return
      failed = false
      LazyComponent = lazy(attempt)
    },
  }
}
