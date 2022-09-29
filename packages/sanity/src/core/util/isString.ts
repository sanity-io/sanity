/** @internal */
export function isString(value: unknown): value is string {
  return typeof value === 'string'
}
