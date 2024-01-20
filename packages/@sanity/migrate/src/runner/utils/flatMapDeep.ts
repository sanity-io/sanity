import {type Path, type PathSegment} from '@sanity/types'

import {type JsonArray, type JsonObject, type JsonValue} from '../../json'
import {getValueType} from './getValueType'

type SkipMarker = {_: 'SKIP_MARKER'}
export const SKIP_MARKER: SkipMarker = {_: 'SKIP_MARKER'}

function callMap<T>(mapFn: MapFn<T>, value: JsonValue, path: Path): T[] {
  const res = mapFn(value, path)
  return Array.isArray(res) ? res : [res]
}

function getPathWithKey(
  item: unknown,
  index: number | string,
  container: JsonArray | JsonObject,
): PathSegment {
  if (
    item &&
    Array.isArray(container) &&
    typeof item === 'object' &&
    '_key' in item &&
    typeof item._key === 'string'
  ) {
    return {_key: item._key}
  }
  return index
}

type MapFn<T> = (value: JsonValue, path: Path) => T | T[]

// Reduce depth first
function mapObject<T>(reducerFn: MapFn<T>, object: JsonObject, path: Path): T[] {
  return [
    ...callMap(reducerFn, object, path),
    ...Object.keys(object).flatMap((key) =>
      flatMapAny(reducerFn, object[key], path.concat(getPathWithKey(object[key], key, object))),
    ),
  ]
}

// Reduce depth first
function mapArray<T>(mapFn: MapFn<T>, array: JsonArray, path: Path): T[] {
  return [
    ...callMap(mapFn, array, path),
    ...array.flatMap((item: JsonValue, index) =>
      flatMapAny(mapFn, item, path.concat(getPathWithKey(item, index, array))),
    ),
  ]
}

function flatMapAny<T>(mapFn: MapFn<T>, val: JsonValue, path: Path) {
  const type = getValueType(val)
  if (type === 'object') {
    return mapObject(mapFn, val as JsonObject, path)
  }
  if (type === 'array') {
    return mapArray(mapFn, val as JsonArray, path)
  }
  return callMap(mapFn, val, path)
}

/**
 * Iterating depth first over the JSON tree, calling the mapFn for parents before children
 * @param value - the value to map deeply over
 * @param mapFn - the mapFn to call for each value
 */
export function flatMapDeep<T>(value: JsonValue, mapFn: MapFn<T>): T[] {
  return flatMapAny(mapFn, value, [])
}
