/* eslint-disable no-shadow */
// eslint is giving false positives no-shadow for typed arguments here

import {useEffect} from 'react'
import {usePrevious} from './usePrevious'

/**
 * A hook for doing side effects as a response to a change in a hook value between renders
 * Usage:
 * ```js
 * useDidUpdate(hasFocus, (hadFocus, hasFocus) => {
 *  if (hasFocus) {
 *    scrollIntoView(elementRef.current)
 *   }
 * })
 * ```
 * @param current The value you want to respond to changes in
 * @param didUpdate Callback to run when the value changes
 */
export function useDidUpdate<T>(current: T, didUpdate: (previous: T, current: T) => void): void
export function useDidUpdate<T>(
  current: T,
  didUpdate: (previous: T, current: T | undefined) => void
): void {
  const previous = usePrevious<T>(current)

  useEffect(() => {
    if (previous !== current) {
      didUpdate(previous, current)
    }
  }, [didUpdate, current, previous])
}
