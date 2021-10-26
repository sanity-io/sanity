import {isObject, uniq} from 'lodash'
import {Observable, of as observableOf} from 'rxjs'
import {switchMap} from 'rxjs/operators'
import props from './utils/props'

import {FieldName, Id, Path, Reference, Document, Value} from './types'

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

type ObserveFieldsFn = (id: string, fields: FieldName[]) => Observable<Record<string, any> | null>

function isRecord(value: unknown): value is Record<string, unknown> {
  return isObject(value)
}

function observePaths(value: Value, paths: Path[], observeFields: ObserveFieldsFn) {
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
    if (isReference(value) || isDocument(value)) {
      const id = isRef ? (value as Reference)._ref : (value as Document)._id
      return observeFields(id, nextHeads).pipe(
        switchMap((snapshot) => {
          if (snapshot === null) {
            return observableOf(null)
          }
          return observePaths(
            {
              ...createEmpty(nextHeads),
              ...(isRef ? {_ref: value._ref} : value),
              ...snapshot,
            },
            paths,
            observeFields
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
        res[head] = value[head]
      } else {
        res[head] = observePaths(value[head] as Record<string, unknown>, tails, observeFields)
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
function normalizeValue(value: Value | Id): Value {
  return typeof value === 'string' ? {_id: value} : value
}

export function createPathObserver(observeFields: ObserveFieldsFn) {
  return (value: Value, paths: (FieldName | Path)[]): Observable<Record<string, unknown> | null> =>
    observePaths(normalizeValue(value), normalizePaths(paths), observeFields)
}
