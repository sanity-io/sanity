import getRandomValues from 'get-random-values'
import {
  IndexTuple,
  isIndexSegment,
  isIndexTuple,
  isKeySegment,
  KeyedSegment,
  Path,
  PathSegment,
} from '@sanity/types'

const rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g
const reKeySegment = /_key\s*==\s*['"](.*)['"]/
const EMPTY_PATH: Path = []

export const FOCUS_TERMINATOR = '$'

export function get(obj: unknown, path: Path | string, defaultVal?: unknown): unknown {
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

      acc = acc.find((item) => item._key === segment._key)
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

export function isEqual(path: Path, otherPath: Path): boolean {
  return (
    path.length === otherPath.length &&
    path.every((segment, i) => isSegmentEqual(segment, otherPath[i]))
  )
}

export function numEqualSegments(path: Path, otherPath: Path): number {
  const length = Math.min(path.length, otherPath.length)
  for (let i = 0; i < length; i++) {
    if (!isSegmentEqual(path[i], otherPath[i])) {
      return i
    }
  }
  return length
}

export function isSegmentEqual(segmentA: PathSegment, segmentB: PathSegment): boolean {
  if (isKeySegment(segmentA) && isKeySegment(segmentB)) {
    return segmentA._key === segmentB._key
  }

  if (isIndexSegment(segmentA)) {
    return Number(segmentA) === Number(segmentB)
  }

  if (isIndexTuple(segmentA) && isIndexTuple(segmentB)) {
    return segmentA[0] === segmentB[0] && segmentA[1] === segmentB[1]
  }

  return segmentA === segmentB
}

export function hasFocus(focusPath: Path, path: Path): boolean {
  const withoutTerminator =
    focusPath[focusPath.length - 1] === FOCUS_TERMINATOR ? focusPath.slice(0, -1) : focusPath
  return isEqual(withoutTerminator, path)
}

export function hasItemFocus(focusPath: Path, item: PathSegment): boolean {
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

export function trimChildPath(path: Path, childPath: Path): Path {
  return startsWith(path, childPath) ? trimLeft(path, childPath) : EMPTY_PATH
}

export function toString(path: Path): string {
  if (!Array.isArray(path)) {
    throw new Error('Path is not an array')
  }

  return path.reduce<string>((target, segment, i) => {
    const segmentType = typeof segment
    if (segmentType === 'number') {
      return `${target}[${segment}]`
    }

    if (segmentType === 'string') {
      const separator = i === 0 ? '' : '.'
      return `${target}${separator}${segment}`
    }

    if (isKeySegment(segment) && segment._key) {
      return `${target}[_key=="${segment._key}"]`
    }

    if (Array.isArray(segment)) {
      const [from, to] = segment
      return `${target}[${from}:${to}]`
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

  if (isIndexTuple(segment)) {
    return normalizeIndexTupleSegment(segment)
  }

  return segment
}

function normalizeIndexSegment(segment: string): PathSegment {
  return Number(segment.replace(/[^\d]/g, ''))
}

function normalizeKeySegment(segment: string): KeyedSegment {
  const segments = segment.match(reKeySegment)
  return {_key: segments![1]}
}

function normalizeIndexTupleSegment(segment: string): IndexTuple {
  const [from, to] = segment.split(':').map((seg) => (seg === '' ? seg : Number(seg)))
  return [from, to]
}

const getByteHexTable = (() => {
  let table
  return () => {
    if (table) {
      return table
    }

    table = []
    for (let i = 0; i < 256; ++i) {
      table[i] = (i + 0x100).toString(16).substring(1)
    }
    return table
  }
})()

// WHATWG crypto RNG - https://w3c.github.io/webcrypto/Overview.html
function whatwgRNG(length = 16) {
  const rnds8 = new Uint8Array(length)
  getRandomValues(rnds8)
  return rnds8
}

export function randomKey(length?: number): string {
  const table = getByteHexTable()
  return whatwgRNG(length)
    .reduce((str, n) => str + table[n], '')
    .slice(0, length)
}
