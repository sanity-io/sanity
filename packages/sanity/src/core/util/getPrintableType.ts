/**
 * Gets the human-friendly printable type name for the given value, for instance it will yield
 * `array` instead of `object`, as the native `typeof` operator would do. Can be extended to
 * account for other types, such as React components, fragments, elements etc, and should thus
 * not be counted as "exhaustive", as the list is both dynamic and will grow over time.
 *
 * @param value - The value to get the type name for
 * @returns A "human friendly" type name
 * @internal
 */
export function getPrintableType(value: unknown): string {
  const nativeType = typeof value

  if (nativeType === 'object') {
    if (value === null) return 'null'
    if (Array.isArray(value)) return 'array'
    if (value instanceof Object && value.constructor.name !== 'Object') {
      return value.constructor.name
    }
  }

  return nativeType
}
