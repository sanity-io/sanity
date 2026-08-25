import {dequal} from 'dequal/lite'
import {useState} from 'react'

/**
 * Returns the previous value whenever the next one is content-equal to it, so
 * derived values (e.g. freshly built arrays with unchanged contents) keep a
 * stable identity across renders and don't cascade into memo invalidation or
 * subscription teardown downstream.
 *
 * Equality is `dequal/lite`: plain objects and arrays compare deeply, Date and
 * RegExp by value, and everything else — functions included — by identity.
 * (Don't feed it Map/Set/class instances; the lite variant only sees their own
 * enumerable properties.)
 *
 * Local duplicate of `core/util/useShallowUnique`: that util is deliberately
 * not exported from `sanity`, and the architectural boundaries
 * (`boundaries/dependencies` in `.oxlintrc.json`) don't let `src/structure`
 * import `src/core` internals directly. Keep the two implementations in sync.
 *
 * @internal
 */
export function useShallowUnique<ValueType>(value: ValueType): ValueType {
  // Boxed: `useState(value)` would call a function value as a lazy
  // initializer and `setPrevious(value)` would apply it as a functional
  // update, so bare function values could never be stored.
  const [previous, setPrevious] = useState<{value: ValueType}>(() => ({value}))
  if (!dequal(previous.value, value)) {
    setPrevious({value})
    return value
  }
  return previous.value
}
