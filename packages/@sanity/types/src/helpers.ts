export function isObject(obj: unknown): obj is Record<string, unknown> {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj)
}

/**
 * A generic [type predicate][0] that asserts the input type is `NonNullable`.
 * This is useful for array `.filter()` checks and similar because using will
 * remove `null` and `undefined` from the type.
 *
 * ```ts
 * const stuff = [0, false, 'one', null, undefined]
 * // type:   `number | boolean | string | null | undefined`
 *
 * const result = stuff.filter(isNonNullable)
 * // type:   `number | boolean | string`
 * // value:  `[0, false, 'one']`
 * ```
 *
 * [0]: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
 */
export function isNonNullable<T>(t: T): t is NonNullable<T> {
  return t !== null || t !== undefined
}
