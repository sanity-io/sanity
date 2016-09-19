import client from 'client:@sanity/base/client'
import {ReferenceInput} from '../../index'
import {unprefixType} from '../utils/unprefixType'

function fetchSingle(id) {
  return client.data.getDocument(id).then(doc => unprefixType(doc))
}

export default ReferenceInput.createBrowser({
  fetch(field) {
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
  },

  materializeReferences(referenceIds) {
    return Promise.all(referenceIds.map(fetchSingle))
  }
})
