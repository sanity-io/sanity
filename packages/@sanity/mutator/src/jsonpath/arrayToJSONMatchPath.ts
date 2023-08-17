import type {Path, PathSegment} from '@sanity/types'
import {isRecord} from '../util'

const IS_DOTTABLE = /^[a-z_$]+/

/**
 * Converts a path in array form to a JSONPath string
 *
 * @param pathArray - Array of path segments
 * @returns String representation of the path
 * @internal
 */
export function arrayToJSONMatchPath(pathArray: Path): string {
  let path = ''
  pathArray.forEach((segment, index) => {
    path += stringifySegment(segment, index === 0)
  })
  return path
}

// Converts an array of simple values (strings, numbers only) to a jsonmatch path string.
function stringifySegment(
  segment: PathSegment | Record<string, unknown>,
  hasLeading: boolean,
): string {
  if (typeof segment === 'number') {
    return `[${segment}]`
  }

  if (isRecord(segment)) {
    const seg = segment as Record<string, unknown>
    return Object.keys(segment)
      .map((key) => (isPrimitiveValue(seg[key]) ? `[${key}=="${seg[key]}"]` : ''))
      .join('')
  }

  if (typeof segment === 'string' && IS_DOTTABLE.test(segment)) {
    return hasLeading ? segment : `.${segment}`
  }

  return `['${segment}']`
}

function isPrimitiveValue(val: unknown): val is string | number | boolean {
  switch (typeof val) {
    case 'number':
    case 'string':
    case 'boolean':
      return true
    default:
      return false
  }
}
