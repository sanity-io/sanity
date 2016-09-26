import {ReferenceInput} from '../../../../src'
import PETS from './mockdata/pets'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

function materializeReferences(ids) {
  return delay(1000).then(() => (
    ids.map(id => PETS.find(pet => pet.$id === id))
  ))
}

function fetch(field) {
  return delay(500).then(() => Promise.resolve(PETS.slice()))
}

function search(query, field) {
  const ms = 1000 - (query.length * 100)
  const queryRE = new RegExp(query || '.*', 'iu')
  return delay(ms).then(() => Promise.resolve(
    PETS.reduce((hits, pet) => {
      const match = queryRE.exec(pet.name)
      if (!match) {
        return hits
      }
      return hits.concat({
        document: pet,
        match: [...match]
      })
    }, [])
  ))
}

const ReferenceAutoComplete = ReferenceInput.createAutoComplete({
  search,
  materializeReferences
})

const ReferenceBrowser = ReferenceInput.createBrowser({
  fetch,
  materializeReferences
})

const ReferenceSelect = ReferenceInput.createSelect({
  search,
  fetchAll: fetch
})

export default function resolveReference(field) {
  const fieldOptions = field.options || {}
  if (fieldOptions.inputType === 'select') {
    return fieldOptions.searchable
      ? ReferenceAutoComplete
      : ReferenceSelect
  }
  return ReferenceBrowser
}
