const id = <T>(value: T): T => value

type ItemSelector<T> = (element: T) => any

// Takes an array and checks if each item is unique,
// optionally by specifying an itemSelector function that will be called with
// each item, returning the value to compare for uniqueness
export function isUniqueBy<T>(array: Array<T>, itemSelector: ItemSelector<T> = id): boolean {
  let prevItem
  let currItem
  for (let i = 0; i < array.length; i++) {
    if (i === 0) {
      prevItem = itemSelector(array[i])
      continue
    }
    currItem = itemSelector(array[i])
    if (prevItem !== currItem) {
      return false
    }
    prevItem = currItem
  }
  return true
}
