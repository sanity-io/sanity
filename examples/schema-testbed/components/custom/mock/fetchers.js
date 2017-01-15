import PETS from './pets'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

export function materializeReferences(ids) {
  return delay(1000).then(() => (
    ids.map(id => PETS.find(pet => pet._id === id))
  ))
}

export function materializeReference(id) {
  return materializeReferences([id]).then(res => res[0])
}

export function fetch(field) {
  return delay(500).then(() => Promise.resolve(PETS.slice()))
}

export function search(query, field) {
  const ms = 1000 - (query.length * 100)
  const queryRE = new RegExp(query || '.*', 'iu')
  return delay(ms).then(() => Promise.resolve(
    PETS.filter(pet => queryRE.exec(pet.name))
  ))
}
