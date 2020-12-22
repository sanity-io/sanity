import * as PathUtils from '@sanity/util/paths'
import {IGNORE_KEYS} from './constants'
import {ArraySchemaType, SchemaType} from '@sanity/types'
import {resolveTypeName} from '../../../utils/resolveTypeName'

export function pathSegmentFrom(value) {
  return {_key: value._key}
}

export function hasFocusInPath(path, value) {
  return path.length === 1 && PathUtils.isSegmentEqual(path[0], pathSegmentFrom(value))
}

export function isEmpty(value) {
  return Object.keys(value).every((key) => IGNORE_KEYS.includes(key))
}

export function getItemType(arrayType: ArraySchemaType, item: any): SchemaType | null {
  const itemTypeName = resolveTypeName(item)

  return itemTypeName === 'object' && arrayType.of.length === 1
    ? arrayType.of[0]
    : arrayType.of.find((memberType) => memberType.name === itemTypeName)
}
