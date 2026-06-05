import {type Path, type PathSegment} from '@sanity/types'

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
    return constraintsFromObject(segment).join('')
  }

  if (typeof segment === 'string' && IS_DOTTABLE.test(segment)) {
    return hasLeading ? segment : `.${segment}`
  }

  return `['${segment}']`
}

// Builds JSONMatch constraint expressions from a (possibly nested) keyed path
// segment. A flat segment like `{_key: 'a'}` becomes `[_key=="a"]`, while a
// nested segment like `{asset: {_ref: 'a'}}` becomes `[asset._ref=="a"]`.
function constraintsFromObject(obj: Record<string, unknown>, prefix = ''): string[] {
  const result: string[] = []
  for (const key of Object.keys(obj)) {
    const value = obj[key]
    const lhs = prefix ? `${prefix}.${key}` : key
    if (isPrimitiveValue(value)) {
      result.push(`[${lhs}=="${value}"]`)
    } else if (isRecord(value)) {
      result.push(...constraintsFromObject(value, lhs))
    }
  }
  return result
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
