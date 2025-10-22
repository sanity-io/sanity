import {type KeyedObject, type Path} from '@sanity/types'
import {toString} from '@sanity/util/paths'

import {isRecord} from '../../util/isRecord'

export interface FlattenOptions {
  /**
   * When compact mode is switched on, object and array fields will not be yielded. They will still
   * be iterated, and their descendant nodes that are primitive types will be yielded.
   */
  compact?: boolean
}

/**
 * Flatten a Sanity object, yielding a `[flatPath: string, value: unknown]` tuple for every
 * descendant node, found at any depth.
 *
 * This is very similar to `Object.entries`, but it flattens the object and produces a JSONMatch
 * path that reflects the full path of each descendant node.
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
 * ['x', { y: 'z' }] // Skipped when operating in compact mode.
 * ['x.y', 'z']
 * ```
 *
 * @internal
 */
export function* flattenObject(
  object: Record<string, unknown>,
  {compact = false}: FlattenOptions = {},
  path: Path = [],
): Generator<[flatPath: string, value: unknown]> {
  if (path.length !== 0 && !compact) {
    yield [toString(path), object]
  }

  for (const [key, value] of Object.entries(object)) {
    if (Array.isArray(value)) {
      yield* flattenArray(value, {compact}, path.concat(key))
      continue
    }

    if (typeof value === 'object' && value !== null) {
      if (isRecord(value)) {
        yield* flattenObject(value, {compact}, path.concat(key))
      }
      continue
    }

    yield [toString(path.concat(key)), value]
  }
}

/**
 * Flatten a Sanity array, yielding a `[flatPath: string, value: unknown]` tuple for every
 * descendant node, found at any depth.
 *
 * This is very similar to `Array.prototype.entries`, but it flattens the array and produces a
 * JSONMatch path that reflects the full path of each descendant node.
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
  {compact = false}: FlattenOptions = {},
  path: Path = [],
): Generator<[flatPath: string, value: unknown]> {
  if (path.length !== 0 && !compact) {
    yield [toString(path), array]
  }

  for (const [index, value] of array.entries()) {
    if (Array.isArray(value)) {
      // Arrays cannot be direct children of arrays.
      continue
    }

    if (typeof value === 'object' && value !== null) {
      if (isRecord(value)) {
        yield* flattenObject(value, {compact}, path.concat({_key: value._key}))
      }
      continue
    }

    yield [toString(path.concat(index)), value]
  }
}
