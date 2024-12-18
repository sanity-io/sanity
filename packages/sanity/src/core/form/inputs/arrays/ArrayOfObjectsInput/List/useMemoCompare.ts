import {useState} from 'react'

export function useMemoCompare<T>(next: T, compare: (prev: T, next: T) => boolean): T {
  // State for storing previous value
  const [previous, setPrevious] = useState<T>(next)
  // Pass previous and next value to compare function
  // to determine whether to consider them equal.
  if (!compare(previous, next)) {
    // We only update if not equal so that this hook continues to return
    // the same old value if compare keeps returning true.
    setPrevious(next)
    // Return the next value right away, no need to have a render cycle with the old value
    return next
  }
  // Finally, return the previous value until it has changed according to the compare function
  return previous
}
