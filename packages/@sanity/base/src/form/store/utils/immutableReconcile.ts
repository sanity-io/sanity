/**
 * Reconciles two versions of a state tree by iterating over the next and deep comparing against the next towards the previous.
 * Wherever identical values are found, the previous value is kept, preserving object identities for arrays and objects where possible
 * @param previous
 * @param next
 */
export function immutableReconcile<T>(
  previous: unknown,
  next: T,
  visited: Set<any> = new Set()
): T {
  if (previous === next) return previous as T

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
    for (let index = 0; index < next.length; index++) {
      if (visited.has(next[index])) {
        return next
      }
      visited.add(next[index])

      const nextItem = immutableReconcile(previous[index], next[index], visited)

      if (nextItem !== previous[index]) {
        allEqual = false
      }
      result[index] = nextItem
    }
    return (allEqual ? previous : result) as any
  }

  if (nextType === 'object') {
    assertType<Record<string, unknown>>(previous)
    assertType<Record<string, unknown>>(next)

    let allEqual = true
    const result: Record<string, unknown> = {}
    for (const key of Object.keys(next)) {
      if (visited.has(next[key])) {
        return next
      }
      visited.add(next[key])

      const nextValue = immutableReconcile(previous[key], next[key]!, visited)
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
// eslint-disable-next-line @typescript-eslint/no-empty-function
function assertType<T>(value: unknown): asserts value is T {}
