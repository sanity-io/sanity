import * as PathUtils from '@sanity/util/paths'
import {IGNORE_KEYS} from './constants'

export function pathSegmentFrom(value) {
  return {_key: value._key}
}

export function hasFocusInPath(path, value) {
  return path.length === 1 && PathUtils.isSegmentEqual(path[0], pathSegmentFrom(value))
}

export function isEmpty(value) {
  return Object.keys(value).every((key) => IGNORE_KEYS.includes(key))
}
