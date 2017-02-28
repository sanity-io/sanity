import client from 'part:@sanity/base/client'
import {uniq, flatten, compact} from 'lodash'

import {observeForPreview, prepareForPreview, resolveRefType} from 'part:@sanity/base/preview'

export function observeReferenceForPreview(value, type) {
  return resolveRefType(value, type)
    .mergeMap(refType => observeForPreview(value, refType))
}

export function valueToString(value, referenceType) {
  return observeReferenceForPreview(value, referenceType)
    .map(previewValue => {
      const memberType = referenceType.to.find(ofType => ofType.name === previewValue._type)
      return prepareForPreview(previewValue, memberType).title
    })
}

function quote(str) {
  return `"${str}"`
}

export function search(textTerm, referenceType) {
  const textFields = uniq(compact(flatten(
    referenceType.to.map(refType =>
      refType.fields.map(field =>
        (field.type.name == 'string' ? field.name : null)
      )
    )
  )))

  const typeFilter = referenceType.to.map(toField => toField.type.name).map(quote)
  const terms = textTerm.split(/\s+/).map(quote)
  const constraints = `_type in [${typeFilter.join(', ')}] && (${textFields.join(', ')}) match (${terms.join(',')})`
  const query = `*[${constraints}]` // todo: see if its possible to use selection from previews here

  return client.observable.fetch(query)
}
