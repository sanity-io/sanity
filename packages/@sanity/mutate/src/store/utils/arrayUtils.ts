export function takeUntil<T>(
  arr: T[],
  predicate: (item: T) => boolean,
  opts?: {inclusive: boolean},
) {
  const result = []
  for (const item of arr) {
    if (predicate(item)) {
      if (opts?.inclusive) {
        result.push(item)
      }
      return result
    }
    result.push(item)
  }
  return result
}

export function takeUntilRight<T>(
  arr: T[],
  predicate: (item: T) => boolean,
  opts?: {inclusive: boolean},
) {
  const result = []
  for (const item of arr.slice().reverse()) {
    if (predicate(item)) {
      if (opts?.inclusive) {
        result.push(item)
      }
      return result
    }
    result.push(item)
  }
  return result.reverse()
}
