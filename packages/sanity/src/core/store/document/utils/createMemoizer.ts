import {type Observable} from 'rxjs'

export function memoize<TFunction extends (...args: any[]) => Observable<any>>(
  fn: TFunction,
  keyGen: (...args: Parameters<TFunction>) => string,
): TFunction {
  const MEMO: {[key: string]: Observable<unknown>} = Object.create(null)
  const memoizedFn = (...args: Parameters<TFunction>): Observable<unknown> => {
    const key = keyGen(...args)
    if (!(key in MEMO)) {
      MEMO[key] = fn(...args)
    }
    return MEMO[key]
  }

  return memoizedFn as TFunction
}
