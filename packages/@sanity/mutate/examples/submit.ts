import {
  at,
  create,
  createIfNotExists,
  patch,
  SanityEncoder,
  set,
  setIfMissing,
} from '@sanity/mutate'

const mutations = [
  create({_type: 'dog', name: 'Fido'}),
  createIfNotExists({_id: 'document-1', _type: 'someType'}),
  createIfNotExists({_id: 'other-document', _type: 'author'}),
  patch('other-document', [
    at('published', set(true)),
    at([], setIfMissing({address: {_type: 'address'}})),
    at('address.city', set('Oslo')),
  ]),
]

// get a projectId and dataset at sanity.io
const projectId = '<projectId>'
const dataset = '<dataset>'

// Submit mutations to the Sanity API
fetch(`https://${projectId}.api.sanity.io/v2023-08-01/data/mutate/${dataset}`, {
  method: 'POST',
  mode: 'cors',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(SanityEncoder.encodeAll(mutations)),
})
  .then(response => response.json())
  .then(result => console.log(result))
