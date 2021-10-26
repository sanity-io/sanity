import {of as observableOf, Observable} from 'rxjs'
import {map, switchMap, catchError} from 'rxjs/operators'
import {isReferenceSchemaType, PreviewValue, ReferenceSchemaType, SchemaType} from '@sanity/types'
import {isPlainObject} from 'lodash'
import prepareForPreview, {invokePrepare} from './utils/prepareForPreview'
import {Reference, PrepareViewOptions, Path} from './types'
import {INSUFFICIENT_PERMISSIONS_FALLBACK, InsufficientPermissionsError} from './constants'
import {getPreviewPaths} from './utils/getPreviewPaths'

const INSUFFICIENT_PERMISSIONS = Symbol('INSUFFICIENT_PERMISSIONS')

export interface PreparedSnapshot {
  type?: SchemaType
  snapshot: null | PreviewValue
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return isPlainObject(value)
}

// Takes a value and its type and prepares a snapshot for it that can be passed to a preview component
export function createPreviewObserver(
  observePaths: (value: any, paths: Path[]) => any,
  resolveRefType: (
    value: Reference,
    ownerType: ReferenceSchemaType
  ) => Observable<SchemaType | undefined>
) {
  return function observeForPreview(
    value: Reference,
    type: SchemaType,
    viewOptions?: PrepareViewOptions
  ): Observable<PreparedSnapshot> {
    if (isReferenceSchemaType(type)) {
      // if the value is of type reference, but has no _ref property, we cannot prepare any value for the preview
      // and the most sane thing to do is to return `null` for snapshot
      if (!value._ref) {
        return observableOf({snapshot: null})
      }
      // Previewing references actually means getting the referenced value,
      // and preview using the preview config of its type
      // todo: We need a way of knowing the type of the referenced value by looking at the reference record alone
      return resolveRefType(value, type).pipe(
        catchError((e) => {
          if (e instanceof InsufficientPermissionsError) {
            return observableOf(INSUFFICIENT_PERMISSIONS)
          }
          throw e
        }),
        switchMap((refType) => {
          if (refType === INSUFFICIENT_PERMISSIONS) {
            return observableOf<PreparedSnapshot>({
              type,
              snapshot: INSUFFICIENT_PERMISSIONS_FALLBACK,
            })
          }

          if (!refType) {
            return observableOf<PreparedSnapshot>({type, snapshot: null})
          }

          return observeForPreview(value, refType)
        })
      )
    }

    const paths = getPreviewPaths(type)
    if (paths) {
      return observePaths(value, paths).pipe(
        map((snapshot) => ({
          type: type,
          snapshot: snapshot && prepareForPreview(snapshot, type, viewOptions),
        }))
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
