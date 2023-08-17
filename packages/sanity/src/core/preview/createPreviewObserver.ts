import {Observable, of as observableOf} from 'rxjs'
import {map, switchMap} from 'rxjs/operators'
import {
  isCrossDatasetReference,
  isCrossDatasetReferenceSchemaType,
  isReferenceSchemaType,
  PrepareViewOptions,
} from '@sanity/types'
import {isPlainObject} from 'lodash'
import {invokePrepare, prepareForPreview} from './utils/prepareForPreview'
import type {ApiConfig, PreviewPath, PreparedSnapshot} from './types'
import {getPreviewPaths} from './utils/getPreviewPaths'
import {Previewable, PreviewableType} from './types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return isPlainObject(value)
}

function isReference(value: unknown): value is {_ref: string} {
  return isPlainObject(value)
}

// Takes a value and its type and prepares a snapshot for it that can be passed to a preview component
export function createPreviewObserver(context: {
  observeDocumentTypeFromId: (id: string, apiConfig?: ApiConfig) => Observable<string | undefined>
  observePaths: (value: Previewable, paths: PreviewPath[], apiConfig?: ApiConfig) => any
}): (
  value: Previewable,
  type: PreviewableType,
  viewOptions?: PrepareViewOptions,
  apiConfig?: ApiConfig,
) => Observable<PreparedSnapshot> {
  const {observeDocumentTypeFromId, observePaths} = context

  return function observeForPreview(
    value: Previewable,
    type: PreviewableType,
    viewOptions?: PrepareViewOptions,
    apiConfig?: ApiConfig,
  ): Observable<PreparedSnapshot> {
    if (isCrossDatasetReferenceSchemaType(type)) {
      // if the value is of type crossDatasetReference, but has no _ref property, we cannot prepare any value for the preview
      // and the most appropriate thing to do is to return `undefined` for snapshot
      if (!isCrossDatasetReference(value)) {
        return observableOf({snapshot: undefined})
      }

      const refApiConfig = {projectId: value._projectId, dataset: value._dataset}

      return observeDocumentTypeFromId(value._ref, refApiConfig).pipe(
        switchMap((typeName) => {
          if (typeName) {
            const refType = type.to.find((toType) => toType.type === typeName)
            return observeForPreview(value, refType as any, {}, refApiConfig)
          }
          return observableOf({snapshot: undefined})
        }),
      )
    }
    if (isReferenceSchemaType(type)) {
      // if the value is of type reference, but has no _ref property, we cannot prepare any value for the preview
      // and the most appropriate thing to do is to return `undefined` for snapshot
      if (!isReference(value)) {
        return observableOf({snapshot: undefined})
      }
      // Previewing references actually means getting the referenced value,
      // and preview using the preview config of its type
      // todo: We need a way of knowing the type of the referenced value by looking at the reference record alone
      return observeDocumentTypeFromId(value._ref).pipe(
        switchMap((typeName) => {
          if (typeName) {
            const refType = type.to.find((toType) => toType.name === typeName)
            return observeForPreview(value, refType as any)
          }
          // todo: in case we can't read the document type, we can figure out the reason why e.g. whether it's because
          //  the document doesn't exist or it's not readable due to lack of permission.
          //  We can use the "observeDocumentAvailability" function
          //  for this, but currently not sure if needed
          return observableOf({snapshot: undefined})
        }),
      )
    }
    const paths = getPreviewPaths(type.preview)
    if (paths) {
      return observePaths(value, paths, apiConfig).pipe(
        map((snapshot) => ({
          type: type,
          snapshot: snapshot && prepareForPreview(snapshot, type as any, viewOptions),
        })),
      )
    }

    // Note: this case is typically rare (or non-existent) and occurs only if
    // the SchemaType doesn't have a `select` field. The schema compiler
    // provides a default `preview` implementation for `object`s, `image`s,
    // `file`s, and `document`s
    return observableOf({
      type,
      snapshot:
        value && isRecord(value) ? invokePrepare(type, value, viewOptions).returnValue : null,
    })
  }
}
