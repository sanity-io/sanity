import {isObject, uniq} from 'lodash'
import {of as observableOf} from 'rxjs'
import {switchMap} from 'rxjs/operators'
import props from './utils/props'

import {FieldName, Id, Path, Reference, Document, Value} from './types'

function isReference(value: Reference | Document | Record<string, any>): value is Reference {
  return '_ref' in value
}

function isDocument(value: Reference | Document | Record<string, any>): value is Document {
  return '_id' in value
}

function createEmpty(fields: FieldName[]): Record<string, any> {
  return fields.reduce((result, field) => {
    result[field] = undefined
    return result
  }, {})
}

function resolveMissingHeads(value, paths) {
  return paths.filter((path) => !(path[0] in value))
}

type ObserveFieldsFn = (id: string, fields: FieldName[]) => any

function observePaths(value: Value, paths: Path[], observeFields: ObserveFieldsFn) {
  if (!isObject(value)) {
    // Reached a leaf. Return as is
    return observableOf(value)
  }
  const pathsWithMissingHeads = resolveMissingHeads(value, paths)
  if (pathsWithMissingHeads.length > 0) {
    // Reached a node that is either a document (with _id), or a reference (with _ref) that
    // needs to be "materialized"

    const nextHeads: string[] = uniq(pathsWithMissingHeads.map((path) => path[0]))

    const isRef = isReference(value)
    if (isReference(value) || isDocument(value)) {
      const id = isRef ? (value as Reference)._ref : (value as Document)._id
      return observeFields(id, nextHeads).pipe(
        switchMap((snapshot: object | null) => {
          if (snapshot === null) {
            return observableOf(null)
          }
          return observePaths(
            {
              ...createEmpty(nextHeads),
              ...(isRef ? {} : value),
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
  const leads = {}
  paths.forEach((path) => {
    const [head, ...tail] = path
    if (!leads[head]) {
      leads[head] = []
    }
    leads[head].push(tail)
  })

  const next = Object.keys(leads).reduce(
    (res, head) => {
      const tails = leads[head]
      if (tails.every((tail) => tail.length === 0)) {
        res[head] = value[head]
      } else {
        res[head] = observePaths(value[head], tails, observeFields)
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

function normalizePaths(path: FieldName[] | Path[]): Path[] {
  // @ts-ignore (not sure why this happens)
  return path.map((segment: any) => (typeof segment === 'string' ? segment.split('.') : segment))
}

// Supports passing either an id or a value (document/reference/object)
function normalizeValue(value: Value | Id): Value {
  return typeof value === 'string' ? {_id: value} : value
}

export default function createPathObserver(observeFields: ObserveFieldsFn) {
  return (value: Value, paths: Path[]) =>
    observePaths(normalizeValue(value), normalizePaths(paths), observeFields)
}
