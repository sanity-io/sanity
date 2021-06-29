import {of as observableOf, Observable} from 'rxjs'
import {map, switchMap} from 'rxjs/operators'
import {isReferenceSchemaType, ReferenceSchemaType, SchemaType} from '@sanity/types'
import prepareForPreview, {invokePrepare, PrepareInvocationResult} from './prepareForPreview'
import {FieldName, Path, Reference, PrepareViewOptions} from './types'
import {INSUFFICIENT_PERMISSIONS} from './constants'

export interface PreviewValue {
  type?: SchemaType
  snapshot: null | PrepareInvocationResult | typeof INSUFFICIENT_PERMISSIONS
}

// Takes a value and its type and prepares a snapshot for it that can be passed to a preview component
export function createPreviewObserver(
  observePaths: (value: any, paths: Path[]) => any,
  resolveRefType: (
    value: Reference,
    ownerType: ReferenceSchemaType
  ) => Observable<SchemaType | typeof INSUFFICIENT_PERMISSIONS | undefined>
) {
  return function observeForPreview(
    value: any,
    type: SchemaType,
    fields: FieldName[],
    viewOptions?: PrepareViewOptions
  ): Observable<PreviewValue> {
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
        switchMap((refType) => {
          if (refType === INSUFFICIENT_PERMISSIONS) {
            return observableOf<PreviewValue>({type, snapshot: INSUFFICIENT_PERMISSIONS})
          }

          if (!refType) {
            return observableOf<PreviewValue>({type, snapshot: null})
          }

          return observeForPreview(value, refType, fields)
        })
      )
    }

    const selection = type.preview?.select
    if (selection) {
      const paths = Object.keys(selection).map((key) => selection[key].split('.'))
      return observePaths(value, paths).pipe(
        map((snapshot) => ({
          type: type,
          snapshot: snapshot && prepareForPreview(snapshot, type, viewOptions),
        }))
      )
    }
    return observableOf({
      type: type,
      snapshot: invokePrepare(type, value, viewOptions),
    })
  }
}
