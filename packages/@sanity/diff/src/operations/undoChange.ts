import {useContext, useCallback} from 'react'
import {useDocumentOperation} from '@sanity/react-hooks'
import {diffItem, pathToString} from 'sanity-diff-patch'
// import {DiffContext} from '../components/diffContext'
import {OperationsAPI, DiffPatch, InsertPatch, UnsetPatch, SetPatch} from './types'
// import {useFieldDiff} from '../components/fieldDiffProvider'

// For reuse outside of "document diff", we could provide required props as
// arguments to this hook instead of using context (or _preferring_ them rather)
export function useUndo() {
  // const {documentId, schemaType} = useContext(DiffContext)
  // const {diff} = useFieldDiff()
  // const doc = useDocumentOperation(documentId, schemaType) as OperationsAPI

  // return useCallback(() => {
  //   const {fromValue, toValue, path} = diff

  //   const patches = diffItem(
  //     toValue,
  //     fromValue,
  //     {id: 'dummy', diffMatchPatch: {enabled: false}},
  //     path
  //   ) as DiffPatch[]

  //   const inserts = patches
  //     .filter((patch): patch is InsertPatch => patch.op === 'insert')
  //     .map(({after, items}) => ({insert: {after, items}}))

  //   const unsets = patches
  //     .filter((patch): patch is UnsetPatch => patch.op === 'unset')
  //     .reduce((acc, patch) => acc.concat(pathToString(patch.path)), [] as string[])

  //   let hasSets = false
  //   const sets = patches
  //     .filter((patch): patch is SetPatch => patch.op === 'set')
  //     .reduce((acc, patch) => {
  //       hasSets = true
  //       acc[pathToString(patch.path)] = patch.value
  //       return acc
  //     }, {} as Record<string, unknown>)

  //   return doc.patch.execute([
  //     ...inserts,
  //     ...(unsets.length > 0 ? [{unset: unsets}] : []),
  //     ...(hasSets ? [{set: sets}] : [])
  //   ])
  // }, [documentId, schemaType, diff, doc])
}
