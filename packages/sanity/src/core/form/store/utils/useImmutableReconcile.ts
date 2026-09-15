import {useState} from 'react'

import {immutableReconcile} from './immutableReconcile'

/**
 * Returns a stable function that structurally shares the previous value when the
 * next value is deeply equal. Keeps previous identity in a closure instead of a
 * ref so React Compiler can compile the calling component.
 *
 * @internal
 */
export function useImmutableReconcile<T>(): (value: T) => T {
  const [reconcile] = useState(() => {
    let last: T | null = null
    return (value: T) => {
      const next = immutableReconcile(last, value)
      last = next
      return next
    }
  })
  return reconcile
}
