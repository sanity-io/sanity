import {ReferenceInput} from 'role:@sanity/form-builder'
import client from 'client:@sanity/base/client'
import {unprefixType} from '../utils/unprefixType'

function fetchSingle(id) {
  return client.fetch('*[.$id == %id]', {id}).then(response => unprefixType(response.result[0]))
}

export default ReferenceInput.createBrowser({
  fetch(field) {

    const toFieldTypes = field.to.map(toField => toField.type)

    const params = toFieldTypes.reduce((acc, toFieldType, i) => {
      acc[`toFieldType${i}`] = `beerfiesta.${toFieldType}`
      return acc
    }, {})

    const eqls = Object.keys(params).map(key => (
      `.$type == %${key}`
    )).join(' || ')

    return client.fetch(`*[${eqls}]`, params)
      .then(response => response.result.map(unprefixType))
  },
  materializeReferences(referenceIds) {
    return Promise.all(referenceIds.map(fetchSingle))
  }
})
