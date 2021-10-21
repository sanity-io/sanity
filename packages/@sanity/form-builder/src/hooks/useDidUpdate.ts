import {useEffect, useRef} from 'react'
import shallowEquals from 'shallow-equals'
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
export function useDidUpdate<T>(
  current: T,
  didUpdate: (previous: T, current: T) => void,
  compare?: (previous: T, current: T) => boolean
): void
export function useDidUpdate<T>(
  current: T,
  didUpdate: (previous: T, current: T | undefined) => void,
  compare: (previous: T, current: T) => boolean = shallowEquals
): void {
  const previous = usePrevious<T>(current)
  const initial = useRef<boolean>(true)
  useEffect(() => {
    if (initial.current) {
      initial.current = false
      return
    }
    if (!compare(previous, current)) {
      didUpdate(previous, current)
    }
  }, [didUpdate, current, previous, compare])
}
