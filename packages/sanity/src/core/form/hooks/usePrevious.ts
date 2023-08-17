import {useEffect, useRef} from 'react'

/**
 * A hook that returns the previous value of a component variable
 * This might be provided by React in the future (https://reactjs.org/docs/hooks-faq.html#how-to-get-the-previous-props-or-state)
 */
export function usePrevious<T>(
  /** The value to track. Will return undefined for first render*/
  value: T,
): T | undefined
export function usePrevious<T>(
  /** The value to track. Will return undefined for first render */
  value: T,
  initial: T,
): T
export function usePrevious<T>(value: T, initial?: T): T | null {
  const ref = useRef<T | null>(initial || null)
  useEffect(() => {
    ref.current = value
  }, [value])
  return ref.current
}
