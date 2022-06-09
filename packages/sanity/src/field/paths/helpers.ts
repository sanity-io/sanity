import {
  IndexTuple,
  isIndexSegment,
  isIndexTuple,
  isKeyedObject,
  isKeySegment,
  KeyedSegment,
  Path,
  PathSegment,
} from '@sanity/types'
import {isRecord} from '../../util/isRecord'

const rePropName =
  /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g
const reKeySegment = /_key\s*==\s*['"](.*)['"]/

export function pathToString(path: Path): string {
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

export function getValueAtPath(rootValue: unknown, path: Path): unknown {
  const segment = path[0]
  if (!segment) {
    return rootValue
  }

  const tail = path.slice(1)
  if (isIndexSegment(segment)) {
    return getValueAtPath(Array.isArray(rootValue) ? rootValue[segment] : undefined, tail)
  }

  if (isKeySegment(segment)) {
    return getValueAtPath(
      Array.isArray(rootValue) ? rootValue.find((item) => item._key === segment._key) : undefined,
      tail
    )
  }

  if (typeof segment === 'string') {
    return getValueAtPath(isRecord(rootValue) ? rootValue[segment] : undefined, tail)
  }

  throw new Error(`Unknown segment type ${JSON.stringify(segment)}`)
}

export function findIndex(array: unknown[], segment: PathSegment): number {
  if (typeof segment !== 'number' && !isKeySegment(segment)) {
    return -1
  }

  return typeof segment === 'number'
    ? segment
    : array.findIndex((item) => isKeyedObject(item) && item._key === segment._key)
}

export function stringToPath(path: string): Path {
  const segments = path.match(rePropName)
  if (!segments) {
    throw new Error('Invalid path string')
  }

  return segments.map(normalizePathSegment)
}

export function normalizePathSegment(segment: string): PathSegment {
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

export function normalizeIndexSegment(segment: string): PathSegment {
  return Number(segment.replace(/[^\d]/g, ''))
}

export function normalizeKeySegment(segment: string): KeyedSegment {
  const segments = segment.match(reKeySegment)
  if (!segments) {
    throw new Error('Invalid key segment')
  }

  return {_key: segments[1]}
}

export function normalizeIndexTupleSegment(segment: string): IndexTuple {
  const [from, to] = segment.split(':').map((seg) => (seg === '' ? seg : Number(seg)))
  return [from, to]
}

export function pathsAreEqual(pathA: Path, pathB: Path): boolean {
  if (pathA.length !== pathB.length) {
    return false
  }

  return pathA.every((segmentA, index) => {
    const segmentB = pathB[index]
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
  })
}

export function getItemKey(arrayItem: unknown): string | undefined {
  return isKeyedObject(arrayItem) ? arrayItem._key : undefined
}

export function getItemKeySegment(arrayItem: unknown): KeyedSegment | undefined {
  const key = getItemKey(arrayItem)
  return key ? {_key: key} : undefined
}

export function isEmptyObject(item: unknown): boolean {
  return typeof item === 'object' && item !== null && Object.keys(item).length <= 0
}
