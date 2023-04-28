import {
  IndexTuple,
  isIndexSegment,
  isIndexTuple,
  isKeySegment,
  KeyedSegment,
  Path,
  PathSegment,
} from '@sanity/types'

const rePropName =
  /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g
const reKeySegment = /_key\s*==\s*['"](.*)['"]/
const EMPTY_PATH: Path = []

export const FOCUS_TERMINATOR = '$'

export function get<R>(obj: unknown, path: Path | string): R | undefined
export function get<R>(obj: unknown, path: Path | string, defaultValue: R): R
export function get(obj: unknown, path: Path | string, defaultVal?: unknown): unknown {
  const select = typeof path === 'string' ? fromString(path) : path
  if (!Array.isArray(select)) {
    throw new Error('Path must be an array or a string')
  }

  let acc: unknown | undefined = obj
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
      acc =
        typeof acc === 'object' && acc !== null
          ? ((acc as Record<string, unknown>)[segment] as Record<string, unknown>)
          : undefined
    }

    if (typeof acc === 'undefined') {
      return defaultVal
    }
  }

  return acc
}

const pathsMemo = new Map<string, Path>()
export function pathFor(path: Path): Path {
  if (path.length === 0) {
    return EMPTY_PATH
  }
  const asString = toString(path)
  if (pathsMemo.has(asString)) {
    return pathsMemo.get(asString)!
  }
  pathsMemo.set(asString, path)
  Object.freeze(path)
  return path
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
  return pathFor(trimLeft(prefixTail, pathTail))
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

  return pathFor(path.slice(0, pathLen - i))
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

export function _resolveKeyedPath(value: unknown, path: Path): Path {
  if (path.length === 0) {
    return path
  }
  const [next, ...rest] = path
  if (typeof next === 'number') {
    if (!Array.isArray(value) || !(next in value)) {
      return []
    }
    const item = value[next]
    const key = item?._key
    return [typeof key === 'string' ? {_key: item._key} : next, ..._resolveKeyedPath(item, rest)]
  }
  const nextVal = get(value, [next])
  return [next, ..._resolveKeyedPath(nextVal, rest)]
}

/**
 * Takes a value and a path that may include numeric indices and attempts to replace numeric indices with keyed paths
 *
 * @param value - any json value
 * @param path - a Path that may include numeric indices
 * @returns a path where numeric indices has been replaced by keyed segments (e.g. `{_key: <key>}`)
 * Will do as good attempt as possible, but in case of missing array items, it will return the best possible match:
 * - `resolveKeyedPath([0, 'bar'], [])` will return [] since array has no value at index 0
 * - `resolveKeyedPath([0, 'foo'], [{_key: 'xyz', 'foo': 'bar'}, {_key: 'abc'}])` will return `[{_key: 'xyz'}, 'foo']` since array has no value at index 0
 * - `resolveKeyedPath([0, 'foo', 'bar'], [{_key: 'xyz'}])` will return `[{_key: 'xyz'}, 'foo', 'bar']` since array has no value at index 0
 * Object keys will be preserved as-is, e.g. `resolveKeyedPath(['foo', 'bar'], undefined)` will return `['foo', 'bar']`
 */
export function resolveKeyedPath(value: unknown, path: Path): Path {
  if (!Array.isArray(path)) {
    throw new Error('Path is not an array')
  }
  return pathFor(_resolveKeyedPath(value, path))
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
