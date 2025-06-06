import {type StackablePerspective} from '@sanity/client'
import {isCrossDatasetReference, isReference} from '@sanity/types'
import {uniq} from 'lodash'
import {type Observable, of as observableOf} from 'rxjs'
import {switchMap} from 'rxjs/operators'

import {isRecord} from '../util'
import {type ApiConfig, type FieldName, type Previewable, type PreviewPath} from './types'
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

function getDocumentId(value: Previewable) {
  if (isReference(value)) {
    return value._ref
  }
  return '_id' in value ? value._id : undefined
}

type ObserveFieldsFn = (
  id: string,
  fields: FieldName[],
  apiConfig?: ApiConfig,
  perspective?: StackablePerspective[],
) => Observable<Record<string, unknown> | null>

function observePaths(
  value: Previewable,
  paths: PreviewPath[],
  observeFields: ObserveFieldsFn,
  apiConfig?: ApiConfig,
  perspective?: StackablePerspective[],
): Observable<Record<string, unknown> | null> {
  if (!value || typeof value !== 'object') {
    // Reached a leaf. Return as is
    return observableOf(value as null) // @todo
  }

  const id = getDocumentId(value)

  const currentValue: Record<string, unknown> = id ? {...value, _id: id} : {...value}

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

    const refApiConfig = isCrossDatasetReference(value)
      ? {projectId: value._projectId, dataset: value._dataset}
      : apiConfig

    return observeFields(id, nextHeads, refApiConfig, perspective).pipe(
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
          refApiConfig,
          perspective,
        )
      }),
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
      res[head] = isRecord(value) ? (value as Record<string, unknown>)[head] : undefined
    } else {
      res[head] = observePaths((value as any)[head], tails, observeFields, apiConfig, perspective)
    }
    return res
  }, currentValue)

  return observableOf(next).pipe(props({wait: true}))
}

// Normalizes path arguments so it supports both dot-paths and array paths, e.g.
// - ['propA.propB', 'propA.propC']
// - [['propA', 'propB'], ['propA', 'propC']]
function normalizePaths(path: (FieldName | PreviewPath)[]): PreviewPath[] {
  return path.map((segment: FieldName | PreviewPath) =>
    typeof segment === 'string' ? segment.split('.') : segment,
  )
}

/**
 * Creates a function that allows observing nested paths on a document.
 * If the path includes a reference, the reference will be "followed", allowing for selecting paths within the referenced document.
 * @param options - Requires a function that can observe fields on a document
 * @internal
 */
export function createPathObserver(options: {observeFields: ObserveFieldsFn}) {
  const {observeFields} = options

  return (
    value: Previewable,
    paths: (FieldName | PreviewPath)[],
    apiConfig?: ApiConfig,
    perspective?: StackablePerspective[],
  ): Observable<Record<string, unknown> | null> => {
    return observePaths(value, normalizePaths(paths), observeFields, apiConfig, perspective)
  }
}
