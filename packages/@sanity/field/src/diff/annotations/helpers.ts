import {UserColorManager, UserColor} from '@sanity/base/user-color'
import {Annotation, Diff, Path, PathSegment, KeyedSegment, ItemDiff} from '../types'
import {FALLBACK_DIFF_COLOR} from './contants'

const rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g
const reKeySegment = /_key\s*==\s*['"](.*)['"]/

export function getAnnotationColor(
  colorManager: UserColorManager,
  annotation?: Annotation | null
): UserColor {
  return annotation ? colorManager.get(annotation.author) : FALLBACK_DIFF_COLOR
}

export function getAnnotationForPath(diff: Diff, diffPath: string | Path): Annotation | undefined {
  const path: Path = Array.isArray(diffPath) ? diffPath : stringToPath(diffPath)
  return getAnnotationAt(diff, path)
}

function getAnnotationAt(diff: Diff, path: Path): Annotation | undefined {
  const diffAt = getDiffAt(diff, path)
  if (!diffAt) {
    return undefined
  }

  if (diffAt.action === 'unchanged') {
    return undefined
  }

  return diffAt.annotation || undefined
}

function getDiffAt(diff: Diff, path: Path, parentPath: Path = []): Diff | undefined {
  if (path.length === 0) {
    return diff
  }

  const segment = path[0]
  const tail = path.slice(1)
  if (isIndexSegment(segment) || isKeySegment(segment)) {
    const location = isIndexSegment(segment) ? `at index ${segment}` : `with key ${segment._key}`
    if (diff.type !== 'array') {
      warn(`Failed to get item ${location} at path ${pathToString(parentPath)} (not an array)`)
      return undefined
    }

    const itemDiff = diff.items.find(
      isIndexSegment(segment)
        ? item => item.toIndex === segment
        : item => itemMatchesKey(item, segment)
    )

    if (!itemDiff) {
      warn(`Failed to get item ${location} at path ${pathToString(parentPath)} (item missing)`)
      return undefined
    }

    return getDiffAt(itemDiff.diff, tail, parentPath.concat(segment))
  }

  if (diff.type !== 'object') {
    warn(`Failed to get property ${segment} at path ${pathToString(parentPath)} (not an object)`)
    return undefined
  }

  const fieldDiff = diff.fields[segment]
  if (typeof fieldDiff === 'undefined') {
    warn(
      `Failed to get property ${segment} at path ${pathToString(parentPath)} (field did not exist)`
    )
    return undefined
  }

  return getDiffAt(fieldDiff, tail, parentPath.concat(segment))
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

function normalizeKeySegment(segment: string): KeyedSegment {
  const segments = segment.match(reKeySegment)
  if (!segments) {
    throw new Error('Invalid key segment')
  }

  return {_key: segments[1]}
}

function isIndexSegment(segment: any): segment is number {
  return typeof segment === 'number' || /^\[\d+\]$/.test(segment)
}

function isKeySegment(segment: any): segment is KeyedSegment {
  if (typeof segment === 'string') {
    return reKeySegment.test(segment.trim())
  }

  return segment && segment._key
}

function warn(msg: string) {
  console.warn(msg)
}

function pathToString(path: Path): string {
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

function stringToPath(path: string): Path {
  const segments = path.match(rePropName)
  if (!segments) {
    throw new Error('Invalid path string')
  }

  return segments.map(normalizePathSegment)
}

function itemMatchesKey(item: ItemDiff, key: KeyedSegment) {
  const itemDiff = item.diff
  return itemDiff.type !== 'object' || !itemDiff.toValue ? false : itemDiff.toValue._key === key
}
