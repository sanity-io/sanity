import {useCallback, useLayoutEffect, useRef} from 'react'

/**
 * A function that always runs the latest closure but keeps one identity, so an effect can call it without listing what it reads (the pattern of
 * React's `useEffectEvent`). The studio folder does not depend on `use-effect-event`, so this is the small local version.
 */
export function useStableEvent<Args extends unknown[], Result>(
  fn: (...args: Args) => Result,
): (...args: Args) => Result {
  const latest = useRef(fn)
  useLayoutEffect(() => {
    latest.current = fn
  })
  return useCallback((...args: Args) => latest.current(...args), [])
}
