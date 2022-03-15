import {isObject, uniq} from 'lodash'
import {Observable, of as observableOf} from 'rxjs'
import {switchMap} from 'rxjs/operators'
import {props} from './utils/props'

import {FieldName, Id, Path, Reference, Document, Previewable, ApiConfig} from './types'

function isReference(value: Reference | Document | Record<string, any>): value is Reference {
  return '_ref' in value
}

function isDocument(value: Reference | Document | Record<string, any>): value is Document {
  return '_id' in value
}

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
) => Observable<Record<string, any> | null>

function isRecord(value: unknown): value is Record<string, unknown> {
  return isObject(value)
}

function observePaths(
  value: Previewable,
  paths: Path[],
  observeFields: ObserveFieldsFn,
  apiConfig?: ApiConfig
): any {
  if (!isRecord(value)) {
    // Reached a leaf. Return as is
    return observableOf(value)
  }
  const pathsWithMissingHeads = resolveMissingHeads(value, paths)
  if (pathsWithMissingHeads.length > 0) {
    // Reached a node that is either a document (with _id), or a reference (with _ref) that
    // needs to be "materialized"

    const nextHeads: string[] = uniq(pathsWithMissingHeads.map((path: string[]) => path[0]))

    const isRef = isReference(value)
    if (isRef || isDocument(value)) {
      const id = isRef ? (value as Reference)._ref : (value as Document)._id

      const refApiConfig =
        // if it's a cross dataset reference we want to use it's `_projectId` + `_dataset`
        // attributes as api config
        isRef && (value as any)._dataset && (value as any)._projectId
          ? {
              projectId: (value as any)._projectId as string,
              dataset: (value as any)._dataset as string,
            }
          : apiConfig

      return observeFields(id, nextHeads, refApiConfig).pipe(
        switchMap((snapshot) => {
          if (snapshot === null) {
            return observableOf(null)
          }
          return observePaths(
            {
              ...createEmpty(nextHeads),
              ...(isRef ? {_ref: value._ref, ...apiConfig} : value),
              ...snapshot,
            },
            paths,
            observeFields,
            refApiConfig
          )
        })
      )
    }
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

  const next = Object.keys(leads).reduce(
    (res: Record<string, unknown>, head) => {
      const tails = leads[head].filter((tail) => tail.length > 0)
      if (tails.length === 0) {
        res[head] = (value as any)[head]
      } else {
        res[head] = observePaths((value as any)[head], tails, observeFields, apiConfig)
      }
      return res
    },
    {...value}
  )

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

// Supports passing either an id or a value (document/reference/object)
function normalizeValue(value: Previewable | Id): Previewable {
  return typeof value === 'string' ? {_id: value} : value
}

export function createPathObserver(context: {observeFields: ObserveFieldsFn}) {
  const {observeFields} = context

  return {
    observePaths(
      value: Previewable | Id,
      paths: (FieldName | Path)[],
      apiConfig?: ApiConfig
    ): Observable<Record<string, unknown> | null> {
      return observePaths(normalizeValue(value), normalizePaths(paths), observeFields, apiConfig)
    },
  }
}
