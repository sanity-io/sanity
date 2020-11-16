import {Observable, of as observableOf} from 'rxjs'
import {map, switchMap} from 'rxjs/operators'
import resolveRefType from './resolveRefType'
import prepareForPreview, {
  invokePrepare,
  PreparedValue,
  PrepareInvocationResult,
} from './prepareForPreview'
import observePaths from './observePaths'
import {FieldName, Type, PrepareViewOptions} from './types'
import {isReferenceSchemaType} from '@sanity/types'

interface PreviewValue {
  type?: Type
  snapshot: symbol | null | PrepareInvocationResult | PreparedValue
}

// Takes a value and its type and prepares a snapshot for it that can be passed to a preview component
export default function observeForPreview(
  value: any,
  type: Type,
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
      switchMap((refType) =>
        refType
          ? observeForPreview(value, refType, fields)
          : observableOf({
              type: type,
              snapshot: null,
            })
      )
    )
  }

  const selection = type.preview?.select
  if (selection) {
    const paths: string[] = Object.keys(selection).map((key) => selection[key].split('.'))
    return observePaths(value, paths).pipe(
      map((snapshot) => ({
        type: type,
        snapshot: snapshot && prepareForPreview(snapshot, type, viewOptions),
      }))
    )
  }
  return observableOf({
    type: type,
    snapshot: invokePrepare(type, value, viewOptions || {}),
  })
}
