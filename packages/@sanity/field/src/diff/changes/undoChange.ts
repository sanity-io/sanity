import {diffItem} from 'sanity-diff-patch'
import {InsertPatch, UnsetPatch, SetPatch, OperationsAPI, Diff, Path, DiffPatch} from '../../types'
import {pathToString} from '../../paths/helpers'

export function undoChange(diff: Diff, path: Path, documentOperations: OperationsAPI): void {
  return documentOperations.patch.execute(buildUndoPatches(diff, path))
}

function buildUndoPatches(diff: Diff, path: Path): DiffPatch[] {
  const patches = diffItem(diff.toValue, diff.fromValue, {diffMatchPatch: {enabled: false}}, path)

  const inserts = patches
    .filter((patch): patch is InsertPatch => patch.op === 'insert')
    .map(({after, items}) => ({insert: {after, items}}))

  const unsets = patches
    .filter((patch): patch is UnsetPatch => patch.op === 'unset')
    .reduce((acc, patch) => acc.concat(pathToString(patch.path)), [] as string[])

  let hasSets = false
  const sets = patches
    .filter((patch): patch is SetPatch => patch.op === 'set')
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
