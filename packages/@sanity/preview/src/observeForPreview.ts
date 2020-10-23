import {of as observableOf, Observable} from 'rxjs'
import {map, switchMap} from 'rxjs/operators'
import resolveRefType from './resolveRefType'
import prepareForPreview, {invokePrepare, PrepareInvocationResult} from './prepareForPreview'
import observePaths from './observePaths'
import {FieldName, Type, ViewOptions} from './types'

function is(typeName: string, type: Type) {
  return type.name === typeName || (type.type && is(typeName, type.type))
}

interface PreviewValue {
  type?: Type
  snapshot: null | PrepareInvocationResult
}

// Takes a value and its type and prepares a snapshot for it that can be passed to a preview component
export default function observeForPreview(
  value: any,
  type: Type,
  fields: FieldName[],
  viewOptions?: ViewOptions
): Observable<PreviewValue> {
  if (is('reference', type)) {
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

  const selection = type.preview.select
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
