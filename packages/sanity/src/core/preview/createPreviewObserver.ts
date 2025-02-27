import {type StackablePerspective} from '@sanity/client'
import {
  isCrossDatasetReference,
  isCrossDatasetReferenceSchemaType,
  isReferenceSchemaType,
  type PrepareViewOptions,
} from '@sanity/types'
import {isPlainObject} from 'lodash'
import {type Observable, of} from 'rxjs'
import {map, switchMap} from 'rxjs/operators'

import {type ObserveForPreviewFn} from './documentPreviewStore'
import {
  type ApiConfig,
  type ObserveDocumentTypeFromIdFn,
  type ObservePathsFn,
  type PreparedSnapshot,
  type Previewable,
  type PreviewableType,
} from './types'
import {getPreviewPaths} from './utils/getPreviewPaths'
import {invokePrepare, prepareForPreview} from './utils/prepareForPreview'

function isRecord(value: unknown): value is Record<string, unknown> {
  return isPlainObject(value)
}

function isReference(value: unknown): value is {_ref: string} {
  return isPlainObject(value)
}

/**
 * Takes a value and its type and prepares a snapshot for it that can be passed to a preview component
 * @internal
 */
export function createPreviewObserver(context: {
  observeDocumentTypeFromId: ObserveDocumentTypeFromIdFn
  observePaths: ObservePathsFn
}): ObserveForPreviewFn {
  const {observeDocumentTypeFromId, observePaths} = context

  return function observeForPreview(
    value: Previewable,
    type: PreviewableType,
    options: {
      viewOptions?: PrepareViewOptions
      apiConfig?: ApiConfig
      perspective?: StackablePerspective[]
    } = {},
  ): Observable<PreparedSnapshot> {
    const {viewOptions = {}, apiConfig, perspective} = options
    if (isCrossDatasetReferenceSchemaType(type)) {
      // if the value is of type crossDatasetReference, but has no _ref property, we cannot prepare any value for the preview
      // and the most appropriate thing to do is to return `undefined` for snapshot
      if (!isCrossDatasetReference(value)) {
        return of({snapshot: undefined})
      }

      const refApiConfig = {projectId: value._projectId, dataset: value._dataset}

      return observeDocumentTypeFromId(value._ref, refApiConfig, perspective).pipe(
        switchMap((typeName) => {
          if (typeName) {
            const refType = type.to.find((toType) => toType.type === typeName)
            if (refType) {
              return observeForPreview(value, refType, {
                apiConfig: refApiConfig,
                viewOptions,
                perspective,
              })
            }
          }
          return of({snapshot: undefined})
        }),
      )
    }
    if (isReferenceSchemaType(type)) {
      // if the value is of type reference, but has no _ref property, we cannot prepare any value for the preview
      // and the most appropriate thing to do is to return `undefined` for snapshot
      if (!isReference(value)) {
        return of({snapshot: undefined})
      }
      // Previewing references actually means getting the referenced value,
      // and preview using the preview config of its type
      // We do this since there's no way of knowing the type of the referenced value by looking at the reference value alone
      return observeDocumentTypeFromId(value._ref).pipe(
        switchMap((typeName) => {
          if (typeName) {
            const refType = type.to.find((toType) => toType.name === typeName)
            if (refType) {
              return observeForPreview(value, refType, {perspective})
            }
          }
          // todo: in case we can't read the document type, we can figure out the reason why e.g. whether it's because
          //  the document doesn't exist or it's not readable due to lack of permission.
          //  We can use the "observeDocumentAvailability" function
          //  for this, but currently not sure if needed
          return of({snapshot: undefined})
        }),
      )
    }
    const paths = getPreviewPaths(type.preview)
    if (paths) {
      return observePaths(value, paths, apiConfig, perspective).pipe(
        map((snapshot) => ({
          type: type,
          snapshot: snapshot ? prepareForPreview(snapshot, type, viewOptions) : null,
        })),
      )
    }

    // Note: this case is typically rare (or non-existent) and occurs only if
    // the SchemaType doesn't have a `select` field. The schema compiler
    // provides a default `preview` implementation for `object`s, `image`s,
    // `file`s, and `document`s
    return of({
      type,
      snapshot:
        value && isRecord(value) ? invokePrepare(type, value, viewOptions).returnValue : null,
    })
  }
}
