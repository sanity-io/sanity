import createPreviewObserver from './createPreviewObserver'
import observeWithPaths from './observeWithPaths'
import resolveRefType from './resolveRefType'
import prepareForPreview, {invokePrepare} from './prepareForPreview'
import Observable from '@sanity/observable'

const observe = createPreviewObserver(observeWithPaths)

function is(typeName, type) {
  return type.name === typeName || (type.type && is(typeName, type.type))
}

// Takes a value and its type and prepares a snapshot for it that can be passed to a preview component
export default function observeForPreview(value, type, fields, viewOptions) {
  if (is('reference', type)) {
    // if the value is of type reference, but has no _ref property, we cannot prepare any value for the preview
    // and the most sane thing to do is to return `null` for snapshot
    if (!value._ref) {
      return Observable.of({snapshot: null})
    }
    // Previewing references actually means getting the referenced value,
    // and preview using the preview config of its type
    // todo: We need a way of knowing the type of the referenced value by looking at the reference record alone
    return resolveRefType(value, type)
      .switchMap(refType =>
        (refType
          ? observeForPreview(value, refType)
          : Observable.of({snapshot: null})
        ))
  }

  const selection = type.preview.select
  if (selection) {
    const configFields = Object.keys(selection)
    const targetFields = fields ? configFields.filter(fieldName => fields.includes(fieldName)) : configFields
    const paths = targetFields.map(key => selection[key].split('.'))
    return observe(value, paths)
      .map(snapshot => ({
        type: type,
        snapshot: prepareForPreview(snapshot, type, viewOptions)
      }))
  }
  return Observable.of({
    type: type,
    snapshot: invokePrepare(type, value, viewOptions)
  })
}
