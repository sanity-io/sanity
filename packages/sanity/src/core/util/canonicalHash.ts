/**
 * Produces a stable string hash of a value where object property order does
 * not affect the result. Recurses into nested objects/arrays and sorts keys
 * before stringifying.
 *
 * Used to compare configuration shapes (e.g. two `AuthConfig` objects) for
 * structural equality without being sensitive to the author's declaration
 * order.
 *
 * Functions are stringified via their source (via the default coercion of
 * `typeof value !== 'object'`), so two arrow functions with identical
 * source compare equal.
 *
 * @internal
 */
export function canonicalHash(value: unknown): string {
  if (typeof value !== 'object' || value === null) return `${value}`

  // Works for arrays as well as objects; arrays' numeric keys sort correctly.
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b, 'en'))
        .map(([k, v]) => [k, canonicalHash(v)]),
    ),
  )
}
