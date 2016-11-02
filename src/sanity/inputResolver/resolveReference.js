import client from 'part:@sanity/base/client'
import {ReferenceInput} from '../../index'
import {unprefixType} from '../utils/unprefixType'
import schema from 'part:@sanity/base/schema'

function fetchSingle(id) {
  return client.getDocument(id).then(doc => unprefixType(doc))
}

function fetch(field) {
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

function materializeReferences(referenceIds) {
  return Promise.all(referenceIds.map(fetchSingle))
}

const ReferenceBrowser = ReferenceInput.createBrowser({
  fetch,
  materializeReferences
})

function search(field) {
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

const ReferenceSearchableSelect = ReferenceInput.createSearchableSelect({
  search,
  materializeReferences
})

const ReferenceSelect = ReferenceInput.createSelect({
  fetchAll: fetch,
  materializeReferences
})

export default function resolveReference(field) {
  const fieldOptions = field.options || {}
  if (fieldOptions.inputType === 'select') {
    return fieldOptions.searchable
      ? ReferenceSearchableSelect
      : ReferenceSelect
  }
  return ReferenceBrowser
}
