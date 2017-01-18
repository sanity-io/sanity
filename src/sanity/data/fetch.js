import client from 'part:@sanity/base/client'
import {unprefixType} from '../utils/unprefixType'
import schema from 'part:@sanity/base/schema'
import {uniq} from 'lodash'

export function fetchSingle(id) {
  return client.getDocument(id).then(doc => unprefixType(doc))
}

export function fetch(field) {
  const toFieldTypes = field.to.map(toField => toField.type)
  const params = toFieldTypes.reduce((acc, toFieldType, i) => {
    acc[`toFieldType${i}`] = `${schema.name}.${toFieldType}`
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

export function search(textTerm, field) {

  const toFieldTypes = field.to.map(toField => `${schema.name}.${toField.type}`).map(quote)

  const textFields = []
  schema.types.forEach(type => {
    type.fields.forEach(schemaField => {
      if (schemaField.type == 'string') {
        textFields.push(schemaField.name)
      }
    })
  })

  let constraints = `[${toFieldTypes.join(', ')}] include _type`

  const terms = textTerm.split(/\s+/)

  constraints = `${constraints} && (${uniq(textFields).join(', ')}) match (${terms.map(term => `"${term}"`).join(', ')})`

  const query = `*[${constraints}]`

  return client.fetch(query)
    .then(response => response.map(unprefixType))
}
