import client from 'part:@sanity/base/client'
import {unprefixType} from '../utils/unprefixType'
import schema from 'part:@sanity/base/schema'

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

export function search(field) {
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
