import {ReferenceInput} from '../../../../src'
import PETS from './mockdata/pets'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

export default ReferenceInput.createBrowser({
  materializeReferences(ids) {
    return delay(500).then(() => (
      ids.map(id => PETS.find(pet => pet.$id === id))
    ))
  },
  fetch(field) {
    return delay(500).then(() => Promise.resolve(PETS.slice()))
  }
})
