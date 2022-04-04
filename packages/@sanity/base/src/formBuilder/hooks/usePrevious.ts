import {useEffect, useRef} from 'react'

/**
 * A hook that returns the previous value of a component variable
 * This might be provided by React in the future (https://reactjs.org/docs/hooks-faq.html#how-to-get-the-previous-props-or-state)
 * @param value The value to track. Will return undefined for first render
 */
export function usePrevious<T>(value: T): T | undefined
export function usePrevious<T>(value: T, initial: T): T
export function usePrevious<T>(value: T, initial?: T): T | null {
  const ref = useRef<T | null>(initial || null)
  useEffect(() => {
    ref.current = value
  }, [value])
  return ref.current
}
