import {Observable} from 'rxjs'

export function memoize<T, Arg1>(
  fn: (arg1: Arg1) => Observable<T>,
  keyGen: (arg1: Arg1) => string
): (arg1: Arg1) => Observable<T>
export function memoize<T, Arg1, Arg2>(
  fn: (arg1: Arg1, arg2: Arg2) => Observable<T>,
  keyGen: (arg1: Arg1, arg2: Arg2) => string
): (arg1: Arg1, arg2: Arg2) => Observable<T>

export function memoize<T, Arg1, Arg2, Arg3>(
  fn: (arg1: Arg1, arg2: Arg2, arg3: Arg3) => Observable<T>,
  keyGen: (arg1: Arg1, arg2: Arg2, arg3: Arg3) => string
): (arg1: Arg1, arg2: Arg2, arg3: Arg3) => Observable<T>

export function memoize<T, Arg1, Arg2, Arg3, Arg4>(
  fn: (arg1: Arg1, arg2: Arg2, arg3: Arg3, arg4: Arg4) => Observable<T>,
  keyGen: (arg1: Arg1, arg2: Arg2, arg3: Arg3, arg4: Arg4) => string
): (arg1: Arg1, arg2: Arg2, arg3: Arg3, arg4: Arg4) => Observable<T>

export function memoize<T, Args>(
  fn: (...args: Args[]) => Observable<T>,
  keyGen: (...args: Args[]) => string
) {
  const MEMO: {[key: string]: Observable<T>} = Object.create(null)
  return (...args: any[]) => {
    const key = keyGen(...args)
    if (!(key in MEMO)) {
      MEMO[key] = fn(...args)
    }
    return MEMO[key]
  }
}
