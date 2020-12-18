import * as PathUtils from '@sanity/util/paths'
import {ArraySchemaType, KeyedSegment, Path, SchemaType} from '@sanity/types'
import {resolveTypeName} from '../../../utils/resolveTypeName'
import {IGNORE_KEYS} from './constants'

type KeyedValue = {_key: string}
export function pathSegmentFrom<T extends KeyedValue>(value: {_key: string}): KeyedSegment {
  return {_key: value._key}
}

export function hasFocusInPath<S extends KeyedValue>(path: Path, value: S) {
  return path.length === 1 && PathUtils.isSegmentEqual(path[0], pathSegmentFrom(value))
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function isEmpty(value: any): value is Record<never, never> {
  return Object.keys(value).every((key) => IGNORE_KEYS.includes(key))
}

export function getItemType(arrayType: ArraySchemaType, item: any): SchemaType | undefined {
  const itemTypeName = resolveTypeName(item)

  return itemTypeName === 'object' && arrayType.of.length === 1
    ? arrayType.of[0]
    : arrayType.of.find((memberType) => memberType.name === itemTypeName)
}
