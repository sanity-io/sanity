import client from 'part:@sanity/base/client'
import {ReferenceInput} from '../../index'
import {unprefixType} from '../utils/unprefixType'

function fetchSingle(id) {
  return client.data.getDocument(id).then(doc => unprefixType(doc))
}

function fetch(field) {
  const toFieldTypes = field.to.map(toField => toField.type)
  const dataset = client.config().dataset
  const params = toFieldTypes.reduce((acc, toFieldType, i) => {
    acc[`toFieldType${i}`] = `${dataset}.${toFieldType}`
    return acc
  }, {})

  const eqls = Object.keys(params).map(key => (
    `.$type == %${key}`
  )).join(' || ')

  return client.data.fetch(`*[${eqls}]`, params)
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
  const dataset = client.config().dataset
  const params = toFieldTypes.reduce((acc, toFieldType, i) => {
    acc[`toFieldType${i}`] = `${dataset}.${toFieldType}`
    return acc
  }, {})

  const eqls = Object.keys(params).map(key => (
    `.$type == %${key}`
  )).join(' || ')

  return client.data.fetch(`*[${eqls}]`, params)
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
