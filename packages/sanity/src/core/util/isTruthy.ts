/** @internal */
export function isTruthy<T>(value: T | false): value is T {
  return Boolean(value)
}
