/* eslint-disable max-depth */
// @flow
import type {Path, PathSegment} from '../typedefs/path'

const rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g
const reKeySegment = /_key\s*==\s*['"](.*)['"]/

export const FOCUS_TERMINATOR = '$'

// eslint-disable-next-line complexity
export function get(obj: mixed, path: Path | string, defaultVal: mixed) {
  const select = typeof path === 'string' ? fromString(path) : path
  if (!Array.isArray(select)) {
    throw new Error('Path must be an array or a string')
  }

  let acc = obj
  for (let i = 0; i < select.length; i++) {
    const segment = select[i]
    if (isIndexSegment(segment)) {
      if (!Array.isArray(acc)) {
        return defaultVal
      }

      acc = acc[segment]
    }

    if (isKeySegment(segment)) {
      if (!Array.isArray(acc)) {
        return defaultVal
      }

      acc = acc.find(item => item._key === segment._key)
    }

    if (typeof segment === 'string') {
      acc = typeof acc === 'object' && acc !== null ? acc[segment] : undefined
    }

    if (typeof acc === 'undefined') {
      return defaultVal
    }
  }

  return acc
}

export function isEqual(path: Path, otherPath: Path) {
  return (
    path.length === otherPath.length &&
    path.every((segment, i) => isSegmentEqual(segment, otherPath[i]))
  )
}

export function isSegmentEqual(pathSegment: PathSegment, otherPathSegment: PathSegment) {
  const pathSegmentType = typeof pathSegment
  const otherPathSegmentType = typeof otherPathSegment
  if (pathSegmentType !== otherPathSegmentType) {
    return false
  }
  if (pathSegmentType === 'string' || pathSegmentType === 'number') {
    return pathSegment === otherPathSegment
  }
  if (!pathSegment || !otherPathSegment) {
    return false
  }
  return pathSegment._key === otherPathSegment._key
}

export function hasFocus(focusPath: Path, path: Path): boolean {
  const _withoutFirst =
    focusPath[focusPath.length - 1] === FOCUS_TERMINATOR ? focusPath.slice(0, -1) : focusPath
  return isEqual(_withoutFirst, path)
}

export function hasItemFocus(focusPath: Path, item: Path): boolean {
  return focusPath.length === 1 && isSegmentEqual(focusPath[0], item)
}

export function isExpanded(segment: PathSegment, focusPath: Path): boolean {
  const [head, ...tail] = focusPath
  return tail.length > 0 && isSegmentEqual(segment, head)
}

export function startsWith(prefix: Path, path: Path): boolean {
  return prefix.every((segment, i) => isSegmentEqual(segment, path[i]))
}

export function trimLeft(prefix: Path, path: Path): Path {
  if (prefix.length === 0 || path.length === 0) {
    return path
  }
  const [prefixHead, ...prefixTail] = prefix
  const [pathHead, ...pathTail] = path
  if (!isSegmentEqual(prefixHead, pathHead)) {
    return path
  }
  return trimLeft(prefixTail, pathTail)
}

export function trimRight(suffix: Path, path: Path): Path {
  const sufLen = suffix.length
  const pathLen = path.length
  if (sufLen === 0 || pathLen === 0) {
    return path
  }

  let i = 0
  while (
    i < sufLen &&
    i < pathLen &&
    isSegmentEqual(path[pathLen - i - 1], suffix[sufLen - i - 1])
  ) {
    i++
  }

  return path.slice(0, pathLen - i)
}

export function toString(path: Path): string {
  if (!Array.isArray(path)) {
    throw new Error('Path is not an array')
  }

  return path.reduce((target, segment, i) => {
    const segmentType = typeof segment
    if (segmentType === 'number') {
      return `${target}[${segment}]`
    }

    if (segmentType === 'string') {
      const separator = i === 0 ? '' : '.'
      return `${target}${separator}${segment}`
    }

    if (segment._key) {
      return `${target}[_key=="${segment._key}"]`
    }

    throw new Error(`Unsupported path segment \`${JSON.stringify(segment)}\``)
  }, '')
}

export function fromString(path: string): Path {
  if (typeof path !== 'string') {
    throw new Error('Path is not a string')
  }

  const segments = path.match(rePropName)
  if (!segments) {
    throw new Error('Invalid path string')
  }

  return segments.map(normalizePathSegment)
}

function normalizePathSegment(segment: string): PathSegment {
  if (isIndexSegment(segment)) {
    return normalizeIndexSegment(segment)
  }

  if (isKeySegment(segment)) {
    return normalizeKeySegment(segment)
  }

  return segment
}

function normalizeIndexSegment(segment: string): PathSegment {
  return Number(segment.replace(/[^\d]/g, ''))
}

function normalizeKeySegment(segment: string): PathSegment {
  const segments = segment.match(reKeySegment)
  return {_key: segments[1]}
}

function isIndexSegment(segment: string | number): boolean {
  return typeof segment === 'number' || /^\[\d+\]$/.test(segment)
}

function isKeySegment(segment: PathSegment): boolean {
  if (typeof segment === 'string') {
    return reKeySegment.test(segment.trim())
  }

  return segment && segment._key
}
