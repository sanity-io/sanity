import {diffItem} from 'sanity-diff-patch'
import {Diff, Path} from '@sanity/diff'
import {toString as pathToString} from '@sanity/util/paths'
import {InsertPatch, UnsetPatch, SetPatch, OperationsAPI} from './types'
import {Annotation} from '../history/types'

export function undoChange(diff: Diff<Annotation>, path: Path, documentOperations: OperationsAPI) {
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

  return documentOperations.patch.execute([
    ...inserts,
    ...(unsets.length > 0 ? [{unset: unsets}] : []),
    ...(hasSets ? [{set: sets}] : [])
  ])
}
