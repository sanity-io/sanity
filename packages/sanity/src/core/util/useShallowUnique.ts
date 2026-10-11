import {useState} from 'react'

import {shallowEquals} from './shallowEquals'

/**
 * Returns the previous value whenever the next one is shallow-equal to it, so
 * derived values (e.g. freshly built arrays with unchanged contents) keep a
 * stable identity across renders and don't cascade into memo invalidation or
 * subscription teardown downstream.
 *
 * @internal
 */
export function useShallowUnique<ValueType>(value: ValueType): ValueType {
  const [previous, setPrevious] = useState<ValueType>(value)
  if (!shallowEquals(previous, value)) {
    setPrevious(value)
    return value
  }
  return previous
}
