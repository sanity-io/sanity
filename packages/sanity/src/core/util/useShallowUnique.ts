import {useState} from 'react'
import shallowEquals from 'shallow-equals'

function isShallowEqual(a: unknown, b: unknown): boolean {
  // `shallow-equals` compares two functions by their own enumerable keys,
  // which reports two DIFFERENT plain functions as equal — retaining a stale
  // first function forever. Functions only count as equal when identical.
  // (Functions nested in objects/arrays are unaffected: members are compared
  // with `===`.)
  if (typeof a === 'function' || typeof b === 'function') return a === b
  return shallowEquals(a, b)
}

/**
 * Returns the previous value whenever the next one is shallow-equal to it, so
 * derived values (e.g. freshly built arrays with unchanged contents) keep a
 * stable identity across renders and don't cascade into memo invalidation or
 * subscription teardown downstream.
 *
 * @internal
 */
export function useShallowUnique<ValueType>(value: ValueType): ValueType {
  // Boxed: `useState(value)` would call a function value as a lazy
  // initializer and `setPrevious(value)` would apply it as a functional
  // update, so bare function values could never be stored.
  const [previous, setPrevious] = useState<{value: ValueType}>(() => ({value}))
  if (!isShallowEqual(previous.value, value)) {
    setPrevious({value})
    return value
  }
  return previous.value
}
