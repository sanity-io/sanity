/**
 * Find the index of the nearest element with the same value. Starts at given index and looks incrementally in either direction for the searchElement
 * It's *NOT* inclusive: If the element matches the element at the startIdx, startIdx will be returned
 * It prefers matches in the first half. If there's a tie it will pick the first element that comes before
 */
export function nearestIndexOf<T>(array: T[], startIdx: number, searchElement: T) {
  return nearestIndex(array, startIdx, (element) => element === searchElement)
}

/**
 * Find the index of the nearest element matching the predicate. Starts at given index and looks incrementally in either direction
 * It's *NOT* inclusive: If the predicate matches the element at the startIdx, startIdx will be returned
 * It prefers matches in the first half. If there's a tie it will pick the first element that comes before
 */
export function nearestIndex<T>(
  array: T[],
  startIdx: number,
  predicate: (element: T, index: number) => boolean
) {
  let lowerIdx = startIdx - 1
  let upperIdx = startIdx
  const len = array.length
  while (lowerIdx > -1 || upperIdx < len) {
    const upper = array[upperIdx]
    if (upperIdx < len && predicate(upper, upperIdx)) {
      return upperIdx
    }
    const lower = array[lowerIdx]
    if (lowerIdx > -1 && predicate(lower, lowerIdx)) {
      return lowerIdx
    }
    lowerIdx--
    upperIdx++
  }
  return -1
}
