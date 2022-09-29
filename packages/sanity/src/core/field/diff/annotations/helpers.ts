import {isIndexSegment, isKeySegment, isIndexTuple, Path, KeyedSegment} from '@sanity/types'
import {UserColorManager, UserColor} from '../../../user-color'
import {stringToPath, pathToString} from '../../paths/helpers'
import {
  Annotation,
  Diff,
  ItemDiff,
  ArrayDiff,
  ObjectDiff,
  StringDiff,
  StringDiffSegment,
} from '../../types'

/** @internal */
export function getAnnotationColor(
  colorManager: UserColorManager,
  annotation?: Annotation | null
): UserColor {
  return colorManager.get(annotation?.author || null)
}

/** @internal */
export function getAnnotationAtPath(diff: Diff, diffPath: string | Path): Annotation | undefined {
  const path: Path = Array.isArray(diffPath) ? diffPath : stringToPath(diffPath)

  return getAnnotationAt(diff, path)
}

/** @internal */
export function getDiffAtPath(diff: Diff, diffPath: string | Path): Diff | undefined {
  const path: Path = Array.isArray(diffPath) ? diffPath : stringToPath(diffPath)
  return getDiffAt(diff, path)
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

// eslint-disable-next-line complexity
function getDiffAt(diff: Diff, path: Path, parentPath: Path = []): Diff | undefined {
  if (path.length === 0) {
    return diff
  }

  const segment = path[0]
  const tail = path.slice(1)

  if (isIndexTuple(segment)) {
    throw new Error('Index tuples are not supported in diff paths')
  }

  if (isIndexSegment(segment) || isKeySegment(segment)) {
    const location = isIndexSegment(segment) ? `at index ${segment}` : `with key ${segment._key}`
    if (diff.type !== 'array') {
      warn(`Failed to get item ${location} at path ${pathToString(parentPath)} (not an array)`)
      return undefined
    }

    const itemDiff = diff.items.find(
      isIndexSegment(segment)
        ? (item) => item.toIndex === segment
        : (item) => itemMatchesKey(item, segment)
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

/* eslint-disable no-console, @typescript-eslint/no-unused-vars */
function warn(msg: string) {
  //console.warn(msg)
}
/* eslint-enable no-console, @typescript-eslint/no-unused-vars */

function itemMatchesKey(item: ItemDiff, key: KeyedSegment) {
  const itemDiff = item.diff
  return itemDiff.type !== 'object' || !itemDiff.toValue ? false : itemDiff.toValue._key === key
}

/** @internal */
export type DiffVisitor = (diff: Diff | StringDiffSegment, path: Path) => boolean

/**
 * Visit all diffs in tree, until visitor returns false
 *
 * @param diff - Diff to visit
 * @param visitor - Visitor function, return false to stop from going deeper
 *
 * @internal
 */
export function visitDiff(
  diff: Diff | StringDiffSegment,
  visitor: DiffVisitor,
  path: Path = []
): void {
  if (!visitor(diff, path)) {
    return
  }

  if (diff.type === 'array') {
    visitArrayDiff(diff, visitor, path)
    return
  }

  if (diff.type === 'object') {
    visitObjectDiff(diff, visitor, path)
    return
  }

  if (diff.type === 'string') {
    visitStringDiff(diff, visitor, path)
  }
}

function visitArrayDiff(diff: ArrayDiff, visitor: DiffVisitor, path: Path) {
  if (diff.action === 'unchanged') {
    return
  }

  diff.items.forEach((itemDiff) => {
    const _key = itemDiff.diff.type === 'object' && (itemDiff.diff.toValue?._key as string)
    const segment = _key ? {_key} : getItemDiffIndex(itemDiff)
    visitDiff(itemDiff.diff, visitor, path.concat(segment))
  })
}

function visitObjectDiff(diff: ObjectDiff, visitor: DiffVisitor, path: Path) {
  if (diff.action === 'unchanged') {
    return
  }

  Object.keys(diff.fields).forEach((fieldName) => {
    const fieldDiff = diff.fields[fieldName]
    visitDiff(fieldDiff, visitor, path.concat(fieldName))
  })
}

function visitStringDiff(diff: StringDiff, visitor: DiffVisitor, path: Path) {
  if (diff.action === 'unchanged') {
    return
  }

  diff.segments.forEach((segment) => {
    visitDiff(segment, visitor, path)
  })
}

function getItemDiffIndex(itemDiff: ItemDiff): number {
  return typeof itemDiff.toIndex === 'undefined' ? itemDiff.fromIndex || 0 : itemDiff.toIndex
}
