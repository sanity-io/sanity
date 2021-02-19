import {useEffect, useRef} from 'react'

export function usePrevious<T>(value: T, initial: T): T
export function usePrevious<T>(value: T, initial?: T): T | undefined {
  const ref = useRef<T | undefined>(initial)
  useEffect(() => {
    ref.current = value
  }, [value])
  return ref.current
}
