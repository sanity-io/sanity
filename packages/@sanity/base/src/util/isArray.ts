/**
 * @internal
 */
export function isArray(value: unknown): value is Array<unknown> {
  return Array.isArray(value)
}
