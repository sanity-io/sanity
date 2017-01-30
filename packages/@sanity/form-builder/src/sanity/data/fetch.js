import client from 'part:@sanity/base/client'
// import {utils as previewUtils} from 'part:@sanity/base/preview'
import {unprefixType} from '../utils/unprefixType'
import schema from 'part:@sanity/base/schema'
import {uniq, flatten, compact} from 'lodash'

export function fetchSingle(id) {
  return client.getDocument(id).then(doc => unprefixType(doc))
}

export function fetch(type) {
  const toFieldTypes = type.to.map(toField => toField.type)
  const params = toFieldTypes.reduce((acc, toFieldType, i) => {
    acc[`toFieldType${i}`] = `${schema.name}.${toFieldType.name}`
    return acc
  }, {})

  const eqls = Object.keys(params).map(key => (
    `_type == $${key}`
  )).join(' || ')

  return client.fetch(`*[${eqls}]`, params)
    .then(response => response.map(unprefixType))
}

export function materializeReferences(referenceIds) {
  return Promise.all(referenceIds.map(fetchSingle))
}

export function materializeReference(id) {
  return materializeReferences([id]).then(res => res[0])
}

function quote(str) {
  return `"${str}"`
}

export function referenceSearch(textTerm, type) {

  const textFields = uniq(compact(flatten(
    type.to.map(refType =>
      refType.fields.map(field =>
        (field.type.name == 'string' ? field.name : null)
      )
    )
  )))

  const typeFilter = type.to.map(toField => `${schema.name}.${toField.type.name}`).map(quote)
  const terms = textTerm.split(/\s+/).map(quote)
  const constraints = `[${typeFilter.join(', ')}] include _type && (${textFields.join(', ')}) match (${terms.join(',')})`
  const query = `*[${constraints}]` // todo: see if its possible to use selection from previews here

  return client.fetch(query)
    .then(response => response.map(unprefixType))
}
