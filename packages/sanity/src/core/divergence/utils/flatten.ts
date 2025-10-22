import {type KeyedObject, type Path} from '@sanity/types'
import {toString} from '@sanity/util/paths'

import {isRecord} from '../../util/isRecord'

/**
 * Flatten a Sanity object, yielding a `[flattenedPath: string, value: unknown]` tuple for every
 * field and array member, found at any depth.
 *
 * This is very similar to `Object.entries`, but it flattens the object and produces a JSONMatch
 * path that reflects the full path of each field.
 *
 * Given the object:
 *
 * ```ts
 * {
 *   x: {
 *     y: 'z'
 *   }
 * }
 * ```
 *
 * This generator will yield:
 *
 * ```ts
 * ['x', { y: 'z' }]
 * ['x.y', 'z']
 * ```
 *
 * @internal
 */
export function* flattenObject(
  object: Record<string, unknown>,
  path: Path = [],
): Generator<[flattenedPath: string, value: unknown]> {
  if (path.length !== 0) {
    yield [toString(path), object]
  }

  for (const [key, value] of Object.entries(object)) {
    if (Array.isArray(value)) {
      yield* flattenArray(value, path.concat(key))
      continue
    }

    if (typeof value === 'object' && value !== null) {
      if (isRecord(value)) {
        yield* flattenObject(value, path.concat(key))
      }
      continue
    }

    yield [toString(path.concat(key)), value]
  }
}

/**
 * Flatten a Sanity array, yielding a `[flattenedPath: string, value: unknown]` tuple for every
 * field and array member, found at any depth.
 *
 * This is very similar to `Array.prototype.entries`, but it flattens the array and produces a
 * JSONMatch path that reflects the full path of each member.
 *
 * Given an array of primitives:
 *
 * ```ts
 * ['a', 'b']
 * ```
 *
 * This generator will yield:
 *
 * ```ts
 * ['[0]', 'a']
 * ['[1]', 'b']
 * ```
 *
 * Given an array of objects:
 *
 * ```ts
 * [
 *   { _key: 'a' },
 *   { _key: 'b' },
 * ]
 * ```
 *
 * This generator will yield:
 *
 * ```ts
 * [
 *   '[_key=="a"]',
 *   { '_key': 'a' },
 * ]
 * [
 *   '[_key=="a"]._key',
 *   'a',
 * ]
 * [
 *   '[_key=="b"]',
 *   { '_key': 'b' },
 * ]
 * [
 *   '[_key=="b"]._key',
 *   'b',
 * ]
 * ```
 *
 * @internal
 */
export function* flattenArray(
  array: (KeyedObject | string | number | boolean | null | undefined)[],
  path: Path = [],
): Generator<[flattenedPath: string, value: unknown]> {
  if (path.length !== 0) {
    yield [toString(path), array]
  }

  for (const [index, value] of array.entries()) {
    if (Array.isArray(value)) {
      // Arrays cannot be direct children of arrays.
      continue
    }

    if (typeof value === 'object' && value !== null) {
      if (isRecord(value)) {
        yield* flattenObject(value, path.concat({_key: value._key}))
      }
      continue
    }

    yield [toString(path.concat(index)), value]
  }
}
