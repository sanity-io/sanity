import {Path, PathSegment, KeyedSegment} from './types'

const rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g
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

    throw new Error(`Unsupported path segment \`${JSON.stringify(segment)}\``)
  }, '')
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

export function isIndexSegment(segment: any): segment is number {
  return typeof segment === 'number' || /^\[\d+\]$/.test(segment)
}

export function isKeySegment(segment: any): segment is KeyedSegment {
  if (typeof segment === 'string') {
    return reKeySegment.test(segment.trim())
  }

  return Boolean(segment && segment._key)
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

    return segmentA === segmentB
  })
}

export function getItemKey(arrayItem: unknown): string | undefined {
  return typeof arrayItem === 'object' && arrayItem !== null
    ? (arrayItem as KeyedSegment)._key
    : undefined
}

export function getItemKeySegment(arrayItem: unknown): KeyedSegment | undefined {
  const key = getItemKey(arrayItem)
  return key ? {_key: key} : undefined
}
