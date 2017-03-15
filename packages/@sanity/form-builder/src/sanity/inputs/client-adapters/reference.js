import client from 'part:@sanity/base/client'
import {uniq, flatten, compact} from 'lodash'

import {observeForPreview} from 'part:@sanity/base/preview'

export function valueToString(value, referenceType) {
  return observeForPreview(value, referenceType)
    .map(result => result.snapshot.title)
}

export function search(textTerm, referenceType) {
  const textFields = uniq(compact(flatten(
    referenceType.to.map(refType =>
      refType.fields.map(field =>
        (field.type.name === 'string' ? field.name : null)
      )
    )
  )))

  const typeConstraints = referenceType.to
    .map(toField => toField.type.name)
    .map(typeName => `is "${typeName}"`)

  const stringConstraints = textFields
    .map(fieldName => `${fieldName} match $term`)

  // todo: see if its possible to use selection from previews here
  const query = `*[(${typeConstraints.join(' || ')}) && (${stringConstraints.join(' || ')})]`

  return client.observable.fetch(query, {term: textTerm.trim()})
}
