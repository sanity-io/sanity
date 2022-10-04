/**
 * Reconciles two versions of a state tree by iterating over the next and deep comparing against the next towards the previous.
 * Wherever identical values are found, the previous value is kept, preserving object identities for arrays and objects where possible
 * @param previous - the previous value
 * @param next - the next/current value
 */
export function immutableReconcile<T>(previous: unknown, next: T): T {
  return _immutableReconcile(previous, next, new WeakSet())
}

function _immutableReconcile<T>(
  previous: unknown,
  next: T,
  /**
   * Keep track of visited nodes to prevent infinite recursion in case of circular structures
   */
  parents: WeakSet<any>
): T {
  if (previous === next) return previous as T

  // eslint-disable-next-line no-eq-null
  if (previous == null || next == null) return next

  const prevType = typeof previous
  const nextType = typeof next

  // Different types
  if (prevType !== nextType) return next

  if (Array.isArray(next)) {
    parents.add(next)

    assertType<unknown[]>(previous)
    assertType<unknown[]>(next)

    let allEqual = previous.length === next.length
    const result = []
    for (let index = 0; index < next.length; index++) {
      if (parents.has(next[index])) {
        return next
      }

      const nextItem = _immutableReconcile(previous[index], next[index], parents)

      if (nextItem !== previous[index]) {
        allEqual = false
      }
      result[index] = nextItem
    }
    return (allEqual ? previous : result) as any
  }

  if (typeof next === 'object') {
    parents.add(next)
    assertType<Record<string, unknown>>(previous)
    assertType<Record<string, unknown>>(next)

    const nextKeys = Object.keys(next)
    let allEqual = Object.keys(previous).length === nextKeys.length
    const result: Record<string, unknown> = {}
    for (const key of nextKeys) {
      if (parents.has(next[key])) {
        return next
      }
      const nextValue = _immutableReconcile(previous[key], next[key]!, parents)
      if (nextValue !== previous[key]) {
        allEqual = false
      }
      result[key] = nextValue
    }
    return (allEqual ? previous : result) as T
  }
  return next
}

// just some typescript trickery get type assertion
// eslint-disable-next-line @typescript-eslint/no-empty-function, no-empty-function
function assertType<T>(value: unknown): asserts value is T {}
