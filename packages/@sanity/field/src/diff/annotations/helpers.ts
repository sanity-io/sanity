import {UserColorManager, UserColor} from '@sanity/base/user-color'
import {Annotation, Diff, Path, KeyedSegment, ItemDiff} from '../types'
import {stringToPath, pathToString, isIndexSegment, isKeySegment} from '../../paths/helpers'
import {FALLBACK_DIFF_COLOR} from './contants'

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

function warn(msg: string) {
  console.warn(msg)
}

function itemMatchesKey(item: ItemDiff, key: KeyedSegment) {
  const itemDiff = item.diff
  return itemDiff.type !== 'object' || !itemDiff.toValue ? false : itemDiff.toValue._key === key
}
