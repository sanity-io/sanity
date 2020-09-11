import {diffItem} from 'sanity-diff-patch'
import {pathToString, getItemKeySegment} from '../../paths/helpers'
import {
  OperationsAPI,
  Diff,
  Path,
  DiffPatch,
  ChangeNode,
  ItemDiff,
  PatchOperations,
  InsertDiffPatch,
  UnsetDiffPatch,
  SetDiffPatch,
  ArrayDiff
} from '../../types'

const diffOptions = {diffMatchPatch: {enabled: false}}

export function undoChange(change: ChangeNode, documentOperations: OperationsAPI): void {
  const patches: PatchOperations[] = []

  if (change.type === 'field' && change.diff.action === 'added') {
    // The reverse of an add operation is an unset -
    // so we don't need to worry about moved items in this case
    patches.push(...buildUnsetPatches(change.diff, change.path))
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
    patches.push(...buildUndoPatches(change.diff, change.path))
  }

  return documentOperations.patch.execute(patches)
}

function buildUnsetPatches(diff: Diff, path: Path): PatchOperations[] {
  return [{unset: [pathToString(path)]}]
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

function buildUndoPatches(diff: Diff, path: Path): PatchOperations[] {
  const patches = diffItem(diff.toValue, diff.fromValue, diffOptions, path) as DiffPatch[]

  const inserts = patches
    .filter((patch): patch is InsertDiffPatch => patch.op === 'insert')
    .map(({after, items}) => ({insert: {after: pathToString(after), items}}))

  const unsets = patches
    .filter((patch): patch is UnsetDiffPatch => patch.op === 'unset')
    .reduce((acc, patch) => acc.concat(pathToString(patch.path)), [] as string[])

  let hasSets = false
  const sets = patches
    .filter((patch): patch is SetDiffPatch => patch.op === 'set')
    .reduce((acc, patch) => {
      hasSets = true
      acc[pathToString(patch.path)] = patch.value
      return acc
    }, {} as Record<string, unknown>)

  return [
    ...inserts,
    ...(unsets.length > 0 ? [{unset: unsets}] : []),
    ...(hasSets ? [{set: sets}] : [])
  ]
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
