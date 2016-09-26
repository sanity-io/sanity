import {ReferenceInput} from '../../../../src'
import PETS from './mockdata/pets'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

export default ReferenceInput.createAutoComplete({
  materializeReferences(ids) {
    return delay(1000).then(() => (
      ids.map(id => PETS.find(pet => pet.$id === id))
    ))
  },
  search(query, field) {
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
})
