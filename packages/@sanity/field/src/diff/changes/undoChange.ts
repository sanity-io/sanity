import {isIndexSegment, isKeyedObject, isKeySegment, isTypedObject, Path} from '@sanity/types'
import {diffItem} from 'sanity-diff-patch'
import {
  findIndex,
  getItemKeySegment,
  getValueAtPath,
  isEmptyObject,
  pathToString
} from '../../paths/helpers'
import {
  ArrayDiff,
  ChangeNode,
  Diff,
  DiffPatch,
  InsertDiffPatch,
  ItemDiff,
  ObjectDiff,
  OperationsAPI,
  PatchOperations,
  SetDiffPatch,
  UnsetDiffPatch
} from '../../types'

const diffOptions = {diffMatchPatch: {enabled: false}}

export function undoChange(
  change: ChangeNode,
  rootDiff: ObjectDiff | null,
  documentOperations: OperationsAPI
): void {
  if (!rootDiff) {
    return
  }

  const patches: PatchOperations[] = []

  // @todo Figure out if reverting the entire `objectDiff`/`arrayDiff` for a group
  // would end up with the same result - in which case reverting the whole thing as
  // a single diff is much faster
  if (change.type === 'group') {
    change.changes.forEach(child => undoChange(child, rootDiff, documentOperations))
    return
  }

  if (change.type === 'field' && change.diff.action === 'added') {
    // The reverse of an add operation is an unset -
    // so we don't need to worry about moved items in this case
    patches.push(...buildUnsetPatches(change.diff, rootDiff, change.path))
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

function buildUnsetPatches(diff: Diff, rootDiff: ObjectDiff, path: Path): PatchOperations[] {
  const previousValue = rootDiff.toValue as Record<string, unknown>

  return [{unset: [pathToString(furthestEmptyAncestor(previousValue, path))]}]
}

/**
 * Find the path to the furthest empty ancestor that's also a stub.
 *
 * Used for removing all stubs when unsetting a nested value.
 *
 * @param previousValue The state of the tree before the change was made.
 * @param currentPath Path of the value to unset. Used for recursing.
 * @param initialPath Same as the first value of currentPath.
 */
function furthestEmptyAncestor(
  previousValue: Record<string, unknown>,
  currentPath: Path,
  initialPath?: Path
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

  return isStub(ancestorValue, ancestorPath, currentPath)
    ? furthestEmptyAncestor(previousValue, ancestorPath, initialPath)
    : currentPath
}

function buildMovePatches(
  itemDiff: ItemDiff,
  parentDiff: ArrayDiff,
  path: Path
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

  return [{unset: [pathToString(path)]}, {insert: {...insertLocation, items: [fromValue]}}]
}

function buildUndoPatches(diff: Diff, rootDiff: ObjectDiff, path: Path): PatchOperations[] {
  const patches = diffItem(diff.toValue, diff.fromValue, diffOptions, path) as DiffPatch[]

  const inserts = patches
    .filter((patch): patch is InsertDiffPatch => patch.op === 'insert')
    .map(({after, items}) => ({insert: {after: pathToString(after), items}}))

  const unsets = patches
    .filter((patch): patch is UnsetDiffPatch => patch.op === 'unset')
    .reduce((acc, patch) => acc.concat(pathToString(patch.path)), [] as string[])

  const stubbedPaths = new Set<string>()
  const stubs: PatchOperations[] = []

  let hasSets = false
  const sets = patches
    .filter((patch): patch is SetDiffPatch => patch.op === 'set')
    .reduce((acc, patch) => {
      hasSets = true
      stubs.push(...getParentStubs(patch.path, rootDiff, stubbedPaths))
      acc[pathToString(patch.path)] = patch.value
      return acc
    }, {} as Record<string, unknown>)

  return [
    ...stubs,
    ...inserts,
    ...(unsets.length > 0 ? [{unset: unsets}] : []),
    ...(hasSets ? [{set: sets}] : [])
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
      stubs.push({insert: {after, items: [getStubValue(nextItem)]}})

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
 * Check if a single item is a stub.
 *
 * An item is a stub if its value is the same as what the
 * value "would have been" if it was a stub.
 *
 * Or it can be an empty object or only containing other stubs.
 *
 * @param item The item to check whether is a stub.
 * @param path The path to the item we're checking.
 * @param ignorePath An optional path to forcefully mark as
 *  a stub regardless of what it actually is.
 */
function isStub(item: unknown, path: Path, ignorePath?: Path): unknown {
  if (ignorePath && pathToString(path) === pathToString(ignorePath)) {
    return true
  }

  const isStubValue = getStubValue(item) === item

  return isStubValue || isEmptyObject(item) || onlyContainsStubs(item, path, ignorePath)
}

/**
 * Check if all items in an object or an array are stubs.
 *
 * @param item The item to check whether is a stub.
 * @param path The path to the item we're checking.
 * @param ignorePath An optional path to forcefully mark as
 *  a stub regardless of what it actually is.
 */
function onlyContainsStubs(item: unknown, path: Path, ignorePath?: Path): boolean {
  if (typeof item != 'object' && !Array.isArray(item)) {
    return false
  }

  for (const child in item) {
    /*
     * An item can be a stub even though it has _type or _key. So only
     * values other than these will count for checking whether it is
     * a stub.
     */
    if (child === '_type' || child === '_key') {
      continue
    }

    if (!isStub(item[child], [...path, child], ignorePath)) {
      return false
    }
  }

  return true
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
      fromValue
    }
  }

  // Shouldn't ever happen
  throw new Error(`Failed to find item at index ${itemDiff.fromIndex}`)
}
