import {useEffect, useRef} from 'react'
import shallowEquals from 'shallow-equals'
import {usePrevious} from './usePrevious'

/**
 * A hook for doing side effects as a response to a change in a hook value between renders
 *
 * @example
 * ```ts
 * useDidUpdate(hasFocus, (hadFocus, hasFocus) => {
 *  if (hasFocus) {
 *    scrollIntoView(elementRef.current)
 *   }
 * })
 * ```
 */
export function useDidUpdate<T>(
  /** The value you want to respond to changes in. */
  current: T,
  /** Callback to run when the value changes. */
  didUpdate: (previous: T | undefined, current: T) => void,
  compare?: (previous: T | undefined, current: T) => boolean
): void
export function useDidUpdate<T>(
  current: T,
  didUpdate: (previous: T | undefined, current: T | undefined) => void,
  compare: (previous: T | undefined, current: T) => boolean = shallowEquals
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
