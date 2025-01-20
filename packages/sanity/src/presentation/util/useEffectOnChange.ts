import {useEffect, useRef} from 'react'
import {useEffectEvent} from 'use-effect-event'

/**
 * Similar to `useEffect`, but only execute the callback on value change.
 * @param value - The value to watch for changes.
 * @param callback - The callback to execute when the value changes.
 * @param initialValue - An optional initial value to compare against.
 * @param comparator - An optional comparator function for determining changes, useful if the value is non-primitive. Should return true if the callback should be executed.
 * @internal
 */
export function useEffectOnChange<T>(
  value: T,
  _callback: (value: T, prevValue: T | undefined) => void | (() => void),
  initialValue?: T,
  comparator?: (a: T, b?: T) => boolean | undefined,
): void {
  const previousValueRef = useRef<T | undefined>(initialValue)
  const callback = useEffectEvent(_callback)

  useEffect(() => {
    const prev = previousValueRef.current
    previousValueRef.current = value
    if (comparator ? comparator(value, prev) : value !== prev) {
      return callback(value, prev)
    }
    return undefined
  }, [callback, comparator, value])
}
