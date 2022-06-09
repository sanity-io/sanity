import {isEqual} from 'lodash'
import {useRef} from 'react'

/**
 * This React hook should be considered an escape hatch – to make sure that a value is the same
 * on every render. SHOULD NOT BE USED IN MOST CASES.
 *
 * @internal
 */
export function useUnique<ValueType>(value: ValueType): ValueType {
  const valueRef = useRef<ValueType>(value)

  if (!isEqual(valueRef.current, value)) {
    valueRef.current = value
  }

  return valueRef.current
}
