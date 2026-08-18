import {useState} from 'react'
import shallowEquals from 'shallow-equals'

/** @internal */
export function useShallowUnique<ValueType>(value: ValueType): ValueType {
  const [previous, setPrevious] = useState<ValueType>(value)
  if (!shallowEquals(previous, value)) {
    setPrevious(value)
    return value
  }
  return previous
}
