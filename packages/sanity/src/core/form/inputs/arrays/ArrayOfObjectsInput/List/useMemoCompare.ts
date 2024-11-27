import {useState} from 'react'

export function useMemoCompare<T>(next: T, compare: (prev: T, next: T) => boolean): T {
  const [previous, setPrevious] = useState(next)
  if (!compare(previous, next)) {
    setPrevious(next)
    return next
  }
  return previous
}
