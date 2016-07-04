import {createReferenceInput} from '../../../../src'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

// eslint-disable-next-line max-len
const PETS = 'Alpaca;Bali cattle;Cat;Cattle;Chicken;Dog;Domestic Bactrian camel;Domestic canary;Domestic dromedary camel;Domestic duck;Domestic goat;Domestic goose;Domestic guineafowl;Domestic hedgehog;Domestic pig;Domestic pigeon;Domestic rabbit;Domestic silkmoth;Domestic silver fox;Domestic turkey;Donkey;Fancy mouse;Fancy rat and Lab rat;Ferret;Gayal;Goldfish;Guinea pig;Guppy;Horse;Koi;Llama;Ringneck dove;Sheep;Siamese fighting fish;Society finch;Water buffalo;Yak;Zebu'.split(';')
  .map(petName => ({
    $type: 'pet',
    $id: petName.toLowerCase().replace(/\s/g, '-'),
    name: petName
  }))

function materializeReferences(ids) {
  return delay(1000).then(() => (
    ids.map(id => PETS.find(pet => pet.$id === id))
  ))
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

export default createReferenceInput({
  materializeReferences,
  search
})
