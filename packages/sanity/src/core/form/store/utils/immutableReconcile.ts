/**
 * Reconciles two versions of a state tree by iterating over the next and deep comparing against the next towards the previous.
 * Wherever identical values are found, the previous value is kept, preserving object identities for arrays and objects where possible
 * @param previous - the previous value
 * @param next - the next/current value
 */
export function immutableReconcile<T>(previous: unknown, next: T): T {
  return _immutableReconcile(previous, next, [])
}

function _immutableReconcile<T>(
  previous: unknown,
  next: T,
  /**
   * Keep track of visited nodes to prevent infinite recursion in case of circular structures
   */
  parents: unknown[],
): T {
  if (previous === next) return previous as T

  if (parents.includes(next)) {
    return next
  }

  // eslint-disable-next-line no-eq-null
  if (previous == null || next == null) return next

  const prevType = typeof previous
  const nextType = typeof next

  // Different types
  if (prevType !== nextType) return next

  if (Array.isArray(next)) {
    assertType<unknown[]>(previous)
    assertType<unknown[]>(next)

    let allEqual = previous.length === next.length
    const result = []

    // add the `next` value to list of parents to prevent infinite recursion in case of circular structures
    const nodeParents = [next, ...parents]
    for (let index = 0; index < next.length; index++) {
      const nextItem = _immutableReconcile(previous[index], next[index], nodeParents)

      if (nextItem !== previous[index]) {
        allEqual = false
      }
      result[index] = nextItem
    }
    // remove `next` from set of parents when we're done iterating over the subtree
    return (allEqual ? previous : result) as T
  }

  if (typeof next === 'object') {
    assertType<Record<string, unknown>>(previous)
    assertType<Record<string, unknown>>(next)

    const nextKeys = Object.keys(next)
    let allEqual = Object.keys(previous).length === nextKeys.length
    const result: Record<string, unknown> = {}
    // add the current `next` value to list of parents to prevent infinite recursion in case of circular structures
    const nodeParents = [next, ...parents]
    for (const key of nextKeys) {
      const nextValue = _immutableReconcile(previous[key], next[key]!, nodeParents)
      if (nextValue !== previous[key]) {
        allEqual = false
      }
      result[key] = nextValue
    }
    // remove `next` from set of parents when we're done iterating over the subtree
    return (allEqual ? previous : result) as T
  }
  return next
}

// just some typescript trickery get type assertion
// eslint-disable-next-line @typescript-eslint/no-empty-function, no-empty-function
function assertType<T>(value: unknown): asserts value is T {}
