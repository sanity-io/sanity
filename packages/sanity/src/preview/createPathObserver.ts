import {isReference} from '@sanity/types'
import {isString, uniq} from 'lodash'
import {Observable, of as observableOf} from 'rxjs'
import {switchMap} from 'rxjs/operators'
import {isRecord} from '../util'
import {FieldName, Path, Previewable, ApiConfig} from './types'
import {props} from './utils/props'

function createEmpty(fields: FieldName[]) {
  return fields.reduce((result: Record<string, undefined>, field) => {
    result[field] = undefined
    return result
  }, {})
}

function resolveMissingHeads(value: Record<string, unknown>, paths: string[][]) {
  return paths.filter((path) => !(path[0] in value))
}

type ObserveFieldsFn = (
  id: string,
  fields: FieldName[],
  apiConfig?: ApiConfig
) => Observable<Record<string, unknown> | null>

function observePaths(
  value: Previewable,
  paths: Path[],
  observeFields: ObserveFieldsFn,
  apiConfig?: ApiConfig
): Observable<Record<string, unknown> | null> {
  if (!value || typeof value !== 'object') {
    // Reached a leaf. Return as is
    return observableOf(value as null) // @todo
  }

  const id: string | undefined = isReference(value) ? value._ref : value._id

  const currentValue: Record<string, unknown> = {...value, _id: id}

  if (currentValue._type === 'reference') {
    delete currentValue._type
    delete currentValue._ref
    delete currentValue._weak
    delete currentValue._dataset
    delete currentValue._projectId
    delete currentValue._strengthenOnPublish
  }

  const pathsWithMissingHeads = resolveMissingHeads(currentValue, paths)

  if (id && pathsWithMissingHeads.length > 0) {
    // Reached a node that is either a document (with _id), or a reference (with _ref) that
    // needs to be "materialized"

    const nextHeads: string[] = uniq(pathsWithMissingHeads.map((path: string[]) => path[0]))

    const dataset = isRecord(value) && isString(value._dataset) ? value._dataset : undefined
    const projectId = isRecord(value) && isString(value._projectId) ? value._projectId : undefined

    const refApiConfig =
      // if it's a cross dataset reference we want to use it's `_projectId` + `_dataset`
      // attributes as api config
      dataset && projectId ? {projectId: projectId, dataset: dataset} : apiConfig

    return observeFields(id, nextHeads, refApiConfig).pipe(
      switchMap((snapshot) => {
        if (snapshot === null) {
          return observableOf(null)
        }

        return observePaths(
          {
            ...createEmpty(nextHeads),
            ...(isReference(value) ? {...value, ...refApiConfig} : value),
            ...snapshot,
          } as Previewable,
          paths,
          observeFields,
          refApiConfig
        )
      })
    )
  }

  // We have all the fields needed already present on value
  const leads: Record<string, string[][]> = {}
  paths.forEach((path) => {
    const [head, ...tail] = path
    if (!leads[head]) {
      leads[head] = []
    }
    leads[head].push(tail)
  })

  const next = Object.keys(leads).reduce((res: Record<string, unknown>, head) => {
    const tails = leads[head].filter((tail) => tail.length > 0)
    if (tails.length === 0) {
      res[head] = isRecord(value) ? value[head] : undefined
    } else {
      res[head] = observePaths((value as any)[head], tails, observeFields, apiConfig)
    }
    return res
  }, currentValue)

  return observableOf(next).pipe(props({wait: true}))
}

// Normalizes path arguments so it supports both dot-paths and array paths, e.g.
// - ['propA.propB', 'propA.propC']
// - [['propA', 'propB'], ['propA', 'propC']]
function normalizePaths(path: (FieldName | Path)[]): Path[] {
  return path.map((segment: FieldName | Path) =>
    typeof segment === 'string' ? segment.split('.') : segment
  )
}

export function createPathObserver(context: {observeFields: ObserveFieldsFn}) {
  const {observeFields} = context

  return {
    observePaths(
      value: Previewable,
      paths: (FieldName | Path)[],
      apiConfig?: ApiConfig
    ): Observable<Record<string, unknown> | null> {
      return observePaths(value, normalizePaths(paths), observeFields, apiConfig)
    },
  }
}
