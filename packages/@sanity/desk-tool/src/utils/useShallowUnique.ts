import {useRef} from 'react'
import shallowEquals from 'shallow-equals'

/**
 * This is a React hook that can be used to make sure a value is the same,
 * when none of it’s values have changed.
 *
 * This is useful for preventing unnecessary renders in some case.
 *
 * @internal
 */
export function useShallowUnique<ValueType>(value: ValueType): ValueType {
  const valueRef = useRef<ValueType>(value)

  if (!shallowEquals(valueRef.current, value)) {
    valueRef.current = value
  }

  return valueRef.current
}
