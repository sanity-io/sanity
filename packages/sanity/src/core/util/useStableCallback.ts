import {useRef, useEffect, useCallback, useLayoutEffect} from 'react'

// Removes the `useLayoutEffect` warning on the server
// https://github.com/reduxjs/react-redux/blob/0f1ab0960c38ac61b4fe69285a5b401f9f6e6177/src/utils/useIsomorphicLayoutEffect.js
const useUniversalLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

/**
 * Wraps incoming values in a stable getter function that returns the latest
 * value. Useful tool for signifying a value should not be considered as a
 * reactive dependency.
 *
 * When this getter is invoked, it pulls the latest value from a hidden ref.
 * This ref is synced with the current inside of a `useLayoutEffect` so that it
 * runs before other `useEffect`s.
 * @internal
 */
export function useStableGetter<T>(value: T): () => T {
  const ref = useRef(value)

  useUniversalLayoutEffect(() => {
    ref.current = value
  }, [value])

  const getValue = useCallback(() => {
    return ref.current
  }, [])

  return getValue
}

/**
 * Returns a stable callback that does not change between re-renders.
 *
 * The implementation uses `useStableGetter` to get latest version of the
 * callback (and the values closed within it) so values are not stale between
 * different invocations.
 * @internal
 */
export function useStableCallback<TArgs extends unknown[], TReturn = void>(
  callback: (...args: TArgs) => TReturn,
): (...args: TArgs) => TReturn {
  const getCallback = useStableGetter(callback)

  return useCallback(
    (...args) => {
      const cb = getCallback()
      return cb(...args)
    },
    [getCallback],
  )
}
