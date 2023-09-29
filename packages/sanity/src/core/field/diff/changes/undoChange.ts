import {toArray} from 'rxjs/operators'
import {
  isIndexSegment,
  isKeyedObject,
  isKeySegment,
  isTypedObject,
  PatchOperations,
  Path,
} from '@sanity/types'
import {
  diffItem,
  type DiffOptions,
  type InsertAfterPatch,
  type SetPatch,
  type UnsetPatch,
} from 'sanity-diff-patch'
import {isRecord} from '../../../util'
import {
  findIndex,
  getItemKeySegment,
  getValueAtPath,
  isEmptyObject,
  pathToString,
} from '../../paths'
import type {
  ArrayDiff,
  ChangeNode,
  Diff,
  ItemDiff,
  ObjectDiff,
  FieldOperationsAPI,
} from '../../types'
import {flattenChangeNode, isAddedAction, isSubpathOf, pathSegmentOfCorrectType} from './helpers'

const diffOptions: DiffOptions = {
  diffMatchPatch: {enabled: false, lengthThresholdAbsolute: 30, lengthThresholdRelative: 1.2},
}

export function undoChange(
  change: ChangeNode,
  rootDiff: ObjectDiff | null,
  documentOperations: FieldOperationsAPI,
): void {
  if (!rootDiff) {
    return
  }

  const patches: PatchOperations[] = []

  if (change.type === 'group') {
    const allChanges = flattenChangeNode(change)

    const unsetChanges = allChanges.filter(isAddedAction)

    allChanges
      .filter((child) => !isAddedAction(child))
      .forEach((child) => undoChange(child, rootDiff, documentOperations))

    patches.push(
      ...buildUnsetPatches(rootDiff, unsetChanges.map((unsetChange) => unsetChange.path).reverse()),
    )
  } else if (change.diff.action === 'added') {
    // The reverse of an add operation is an unset -
    // so we don't need to worry about moved items in this case
    patches.push(...buildUnsetPatches(rootDiff, [change.path]))
  } else if (
    change.type === 'field' &&
    change.itemDiff &&
    change.parentDiff &&
    change.parentDiff.type === 'array' &&
    change.itemDiff.hasMoved
  ) {
    // If an array item has moved, we need to unset + insert it again
    // (we lack a "move" patch currently)
    patches.push(...buildMovePatches(change.itemDiff, change.parentDiff, change.path))
  } else {
    // For all other operations, try to find the most optimal case
    patches.push(...buildUndoPatches(change.diff, rootDiff, change.path))
  }

  documentOperations.patch.execute(patches)
}

function buildUnsetPatch(rootDiff: ObjectDiff, path: Path, concurrentUnsetPaths: Path[]): Path {
  const previousValue = rootDiff.toValue as Record<string, unknown>

  return furthestEmptyAncestor(previousValue, path, concurrentUnsetPaths)
}

function buildUnsetPatches(rootDiff: ObjectDiff, paths: Path[]): PatchOperations[] {
  const patches: Path[] = []

  for (let i = 0; i < paths.length; i++) {
    const unsetByEarlierPatch = patches.some((patch) => isSubpathOf(paths[i], patch))

    if (unsetByEarlierPatch) {
      continue
    }

    patches.push(buildUnsetPatch(rootDiff, paths[i], paths))
  }

  return [{unset: [...new Set(patches.map(pathToString))]}]
}

/**
 * Find the path to the furthest empty ancestor that's also a stub.
 *
 * Used for removing all stubs when unsetting a nested value.
 */
function furthestEmptyAncestor(
  /**
   * The state of the tree before the change was made.
   */
  previousValue: Record<string, unknown>,
  /**
   * Path of the value to unset. Used for recursing.
   */
  currentPath: Path,
  /**
   * An optional list of path to forcefully mark as a stub regardless of what it actually is.
   */
  ignorePaths: Path[] = [],
  /**
   * Same as the first value of currentPath.
   */
  initialPath?: Path,
): Path {
  if (currentPath.length <= 0) {
    /*
     * This means we are at root and no ancestors are stubs. We
     * can therefore safely unset only the actual value.
     */
    if (!initialPath) {
      /*
       * Will happen if the function is started with `currentPath = []`.
       */
      throw new Error('Root has no ancestor')
    }

    return initialPath
  }

  const ancestorPath = currentPath.slice(0, -1)
  const ancestorValue = getValueAtPath(previousValue, ancestorPath)

  /*
   * If the ancestor also is a stub we can add it to the ignore-list
   * so it'll be "remembered" as a stub without us having to scan
   * the whole tree again.
   */
  const updatedIgnorePaths = [
    ancestorPath,

    /*
     * We can filter out all the subpaths from under this ancestor
     * because since we ignore it higher up in the tree it doesn't
     * matter anymore what the values of subpaths are.
     */
    ...ignorePaths.filter((path) => !isSubpathOf(path, ancestorPath)),
  ]

  return isStub(ancestorValue, ancestorPath, ignorePaths)
    ? furthestEmptyAncestor(previousValue, ancestorPath, updatedIgnorePaths, initialPath)
    : currentPath
}

function buildMovePatches(
  itemDiff: ItemDiff,
  parentDiff: ArrayDiff,
  path: Path,
): PatchOperations[] {
  const basePath = path.slice(0, -1)
  const {parentValue, fromIndex, fromValue} = getFromItem(parentDiff, itemDiff)

  let insertLocation
  if (fromIndex === 0) {
    // If it was moved from the beginning, we can use a simple prepend
    insertLocation = {before: pathToString([...basePath, 0])}
  } else {
    // Try to use item key segments where possible, falling back to array indexes
    const prevIndex = fromIndex - 1
    const prevItemKey = getItemKeySegment(parentValue[prevIndex])
    const prevSegment = prevItemKey || prevIndex
    insertLocation = {after: pathToString([...basePath, prevSegment])}
  }

  return [
    {
      unset: [pathToString(path)],
    },
    {
      insert: {...insertLocation, items: [fromValue]} as any,
    },
  ]
}

function buildUndoPatches(diff: Diff, rootDiff: ObjectDiff, path: Path): PatchOperations[] {
  const patches = diffItem(diff.toValue, diff.fromValue, diffOptions, path)

  const inserts = patches
    .filter((patch): patch is InsertAfterPatch => patch.op === 'insert')
    .map(({after, items}) => ({insert: {after: pathToString(after), items}}) as any)

  const unsets = patches
    .filter((patch): patch is UnsetPatch => patch.op === 'unset')
    .reduce((acc, patch) => acc.concat(pathToString(patch.path)), [] as string[])

  const stubbedPaths = new Set<string>()
  const stubs: PatchOperations[] = []

  let hasSets = false
  const sets = patches
    .filter((patch): patch is SetPatch => patch.op === 'set')
    .reduce(
      (acc, patch) => {
        hasSets = true
        stubs.push(...getParentStubs(patch.path, rootDiff, stubbedPaths))
        acc[pathToString(patch.path)] = patch.value
        return acc
      },
      {} as Record<string, unknown>,
    )

  return [
    ...stubs,
    ...inserts,
    ...(unsets.length > 0 ? [{unset: unsets}] : []),
    ...(hasSets ? [{set: sets}] : []),
  ]
}

function getParentStubs(path: Path, rootDiff: ObjectDiff, stubbed: Set<string>): PatchOperations[] {
  const value = rootDiff.fromValue as Record<string, unknown>
  const nextValue = rootDiff.toValue as Record<string, unknown>
  const stubs: PatchOperations[] = []

  for (let i = 1; i <= path.length; i++) {
    const subPath = path.slice(0, i)
    const pathStr = pathToString(subPath)
    if (stubbed.has(pathStr)) {
      continue
    }

    const nextSegment = path[i]
    const nextIsArrayElement = isKeySegment(nextSegment) || isIndexSegment(nextSegment)
    const itemValue = getValueAtPath(value, subPath)
    const stub = getStubValue(itemValue)

    // If the next array element does not exist, we need to inject an insert stub here
    if (
      nextIsArrayElement &&
      Array.isArray(itemValue) &&
      !getValueAtPath(nextValue, path.slice(0, i + 1))
    ) {
      const indexAtPrev = findIndex(itemValue, nextSegment)
      const prevItem = itemValue[indexAtPrev - 1]
      const nextItem = getValueAtPath(value, subPath.concat(nextSegment))
      const prevSeg = isKeyedObject(prevItem) ? {_key: prevItem._key} : indexAtPrev - 1
      const after = pathToString(subPath.concat(indexAtPrev < 1 ? 0 : prevSeg))
      stubs.push({setIfMissing: {[pathStr]: []}})
      stubs.push({insert: {after, items: [getStubValue(nextItem)]} as any})

      i++
      continue
    }

    if (typeof stub === 'undefined') {
      continue
    }

    stubbed.add(pathStr)
    stubs.push({setIfMissing: {[pathStr]: stub as Record<string, unknown>}})
  }
  return stubs
}

/**
 * Check if all items in an object or an array are stubs.
 */
function onlyContainsStubs(
  /**
   * The item to check whether is a stub.
   */
  item: unknown,
  /**
   * The path to the item we're checking.
   */
  path: Path,
  /**
   * An optional list of path to forcefully mark as a stub regardless of what it actually is.
   */
  ignorePaths?: Path[],
): boolean {
  /*
   * If we're trying to check for stubs inside something which isn't an object
   * or an array we're checking a string for example and it they cannot
   * contain stubs.
   */
  if (!isRecord(item) || !Array.isArray(item)) {
    return false
  }

  for (const child in item) {
    if (!Object.prototype.hasOwnProperty.call(item, child)) {
      continue
    }

    /*
     * _type or _key field alone doesn't affect whether the field is a stub or
     * not.
     */
    if (child === '_type' || child === '_key') {
      continue
    }

    const nextPath = [...path, pathSegmentOfCorrectType(item as Record<string, unknown>, child)]

    if (!isStub(item[child], nextPath, ignorePaths)) {
      return false
    }
  }

  return true
}

function isStub(item: unknown, path: Path, ignorePaths?: Path[]): boolean {
  const isIgnoredPath = ignorePaths?.some(
    (ignorePath) => pathToString(ignorePath) === pathToString(path),
  )

  const isEmptyArray = Array.isArray(item) && item.length <= 0

  return (
    isIgnoredPath ||
    item === undefined ||
    item === null ||
    isEmptyArray ||
    isEmptyObject(item) ||
    onlyContainsStubs(item, path, ignorePaths)
  )
}

function getStubValue(item: unknown): unknown {
  if (Array.isArray(item)) {
    return []
  }

  if (typeof item !== 'object' || item === null) {
    return undefined
  }

  const props: Record<string, unknown> = {}

  if (isKeyedObject(item)) {
    props._key = item._key
  }

  if (isTypedObject(item)) {
    props._type = item._type
  }

  return props
}

function getFromItem(parentDiff: ArrayDiff, itemDiff: ItemDiff) {
  if (parentDiff.fromValue && typeof itemDiff.fromIndex === 'number') {
    const fromValue = parentDiff.fromValue[itemDiff.fromIndex]
    return {
      parentValue: parentDiff.fromValue,
      fromIndex: itemDiff.fromIndex,
      fromValue,
    }
  }

  // Shouldn't ever happen
  throw new Error(`Failed to find item at index ${itemDiff.fromIndex}`)
}
