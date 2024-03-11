export function keyOf(value: any): string | null {
  return (
    (value !== null &&
      typeof value === 'object' &&
      typeof value._key === 'string' &&
      value._key) ||
    null
  )
}
