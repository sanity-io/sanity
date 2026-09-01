/**
 * Shallow equality for plain objects and arrays, comparing entries with `===` one level deep.
 *
 * The object branch iterates with `for..in` instead of `Object.keys` on purpose: it avoids two
 * array allocations per call and benchmarks ~2x faster on the flat records this compares
 * (permission results, pane params, document top levels).
 *
 * @internal
 */
export function shallowEquals<T>(a: T, b: T): boolean {
  if (a === b) return true
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false
  const aIsArray = Array.isArray(a)
  if (aIsArray !== Array.isArray(b)) return false
  if (aIsArray) {
    const arrayA = a as unknown[]
    const arrayB = b as unknown[]
    if (arrayA.length !== arrayB.length) return false
    for (let index = 0; index < arrayA.length; index++) {
      if (arrayA[index] !== arrayB[index]) return false
    }
    return true
  }
  const recordA = a as Record<string, unknown>
  const recordB = b as Record<string, unknown>
  let countA = 0
  let countB = 0
  for (const key in recordA) {
    if (Object.prototype.hasOwnProperty.call(recordA, key)) {
      if (recordA[key] !== recordB[key]) return false
      countA++
    }
  }
  for (const key in recordB) {
    if (Object.prototype.hasOwnProperty.call(recordB, key)) countB++
  }
  return countA === countB
}
