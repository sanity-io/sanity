import {type KeyedObject} from '@sanity/types'

/**
 * Transforms an array of keys into an array of keyed objects.
 *
 * @example
 * ```ts
 * keyArray('a', 'b', 'c')
 *
 * // [{_key: 'a'}, {_key: 'b'}, {_key: 'c'}]
 * ```
 *
 * @internal
 */
export function keyArray(...keys: string[]): KeyedObject[] {
  return keys.map((_key) => ({_key}))
}
