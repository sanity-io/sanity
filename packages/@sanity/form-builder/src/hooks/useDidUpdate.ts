import {useEffect} from 'react'
import {usePrevious} from './usePrevious'

export function useDidUpdate<T>(value: T, didUpdate: (current: T, previous: T) => void): void
export function useDidUpdate<T>(
  value: T,
  didUpdate: (current: T, previous: T | undefined) => void,
  initial?: T
): void {
  const previous = usePrevious<T>(value, initial)

  useEffect(() => {
    if (previous !== value) {
      didUpdate(value, previous)
    }
  }, [didUpdate, value, previous])
}
