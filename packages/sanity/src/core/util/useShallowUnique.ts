import {useState} from 'react'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false
  const ctor = value.constructor
  return !ctor || ctor === Object
}

/**
 * dequal/lite-shaped deep equality, except class instances / Map / Set compare
 * by identity. dequal/lite walks those by enumerable own keys, which would
 * treat distinct SanityClient / Schema / store instances as unchanged when
 * their private fields differ, and can stack-overflow on cyclic graphs
 * (`client` ↔ `observable`).
 */
function contentEqual(left: unknown, right: unknown): boolean {
  if (left === right) return true

  if (left instanceof Date) {
    return right instanceof Date && left.getTime() === right.getTime()
  }
  if (left instanceof RegExp) {
    return right instanceof RegExp && left.toString() === right.toString()
  }

  if (Array.isArray(left)) {
    if (!Array.isArray(right) || left.length !== right.length) return false
    for (let index = 0; index < left.length; index++) {
      if (!contentEqual(left[index], right[index])) return false
    }
    return true
  }

  if (!isPlainObject(left) || !isPlainObject(right)) {
    return left !== left && right !== right
  }

  let ownCount = 0
  for (const key in left) {
    if (Object.hasOwn(left, key)) {
      ownCount++
      if (!Object.hasOwn(right, key)) return false
    }
    if (!(key in right) || !contentEqual(left[key], right[key])) return false
  }
  return Object.keys(right).length === ownCount
}

/**
 * Returns the previous value whenever the next one is content-equal to it, so
 * derived values (e.g. freshly built arrays with unchanged contents) keep a
 * stable identity across renders and don't cascade into memo invalidation or
 * subscription teardown downstream.
 *
 * Equality is a dequal/lite-shaped walk: plain objects and arrays compare
 * deeply, Date and RegExp by value, and everything else — functions, Map, Set,
 * and class instances — by identity.
 *
 * Deliberately not exported from `sanity` — this is an implementation detail
 * of keeping observable identities render-stable, not public API.
 *
 * @internal
 */
export function useShallowUnique<ValueType>(value: ValueType): ValueType {
  // Boxed: `useState(value)` would call a function value as a lazy
  // initializer and `setPrevious(value)` would apply it as a functional
  // update, so bare function values could never be stored.
  const [previous, setPrevious] = useState<{value: ValueType}>(() => ({value}))
  if (!contentEqual(previous.value, value)) {
    setPrevious({value})
    return value
  }
  return previous.value
}
