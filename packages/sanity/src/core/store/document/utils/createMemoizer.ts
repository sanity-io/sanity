export function memoize<TFunction extends (...args: any[]) => unknown>(
  fn: TFunction,
  keyGen: (...args: Parameters<TFunction>) => string,
): TFunction {
  const MEMO: {[key: string]: unknown} = Object.create(null)
  const memoizedFn = (...args: Parameters<TFunction>): unknown => {
    const key = keyGen(...args)
    if (!(key in MEMO)) {
      MEMO[key] = fn(...args)
    }
    return MEMO[key]
  }

  return memoizedFn as TFunction
}
