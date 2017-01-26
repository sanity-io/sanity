import client from 'part:@sanity/base/client'
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

export function fetchQuery(query, params) {
  return client.fetch(query, params)
}

function quote(str) {
  return `"${str}"`
}

export function search(textTerm, type) {
  const refTypes = type.to.map(toField => `${schema.name}.${toField.type}`).map(quote)

  const textFields = compact(flatten(
    refTypes.map(refType =>
      refType.fields.map(field =>
        (field.type.name == 'string' ? field.name : null)
      )
    )
  ))

  let constraints = `[${refTypes.join(', ')}] include _type`

  const terms = textTerm.split(/\s+/)

  constraints = `${constraints} && (${uniq(textFields).join(', ')}) match (${terms.map(term => `"${term}"`).join(', ')})`

  const query = `*[${constraints}]`

  return client.fetch(query)
    .then(response => response.map(unprefixType))
}
