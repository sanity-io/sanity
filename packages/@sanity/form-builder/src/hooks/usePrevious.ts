import {useEffect, useRef} from 'react'

/**
 * A hook that returns the previous value of a component variable
 * This might be provided by React in the future (https://reactjs.org/docs/hooks-faq.html#how-to-get-the-previous-props-or-state)
 * @param value The value to track. Will return undefined for first render
 */
export function usePrevious<T>(value: T): T {
  const ref = useRef<T>()
  useEffect(() => {
    ref.current = value
  }, [value])
  return ref.current
}
