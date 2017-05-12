import createPreviewObserver from './createPreviewObserver'
import observeWithPaths from './observeWithPaths'
import resolveRefType from './resolveRefType'
import prepareForPreview from './prepareForPreview'
import Observable from '@sanity/observable'

const observe = createPreviewObserver(observeWithPaths)

// Takes a value and its type and prepares a snapshot for it that can be passed to a preview component
export default function observeForPreview(value, type, fields) {
  if (type.name === 'reference') {
    // if the value is of type reference, but has no _ref property, we cannot prepare any value for the preview
    // and the most sane thing to do is to return `null` for snapshot
    if (!value._ref) {
      return Observable.of({snapshot: null, type: type})
    }
    // Previewing references actually means getting the referenced value,
    // and preview using the preview config of its type
    // todo: We need a way of knowing the type of the referenced value by looking at the reference record alone
    return resolveRefType(value, type)
      .switchMap(refType => observeForPreview(value, refType))
  }

  const selection = type.preview.select
  const configFields = Object.keys(selection)
  const targetFields = fields ? configFields.filter(fieldName => fields.includes(fieldName)) : configFields
  const paths = targetFields.map(key => selection[key].split('.'))

  return observe(value, paths)
    .map(snapshot => ({type: type, snapshot: prepareForPreview(snapshot, type)}))
}
