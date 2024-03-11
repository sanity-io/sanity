import {createIfNotExists, del} from '@sanity/mutate'
import {applyInCollection} from '@sanity/mutate/_unstable_apply'

const initial = [{_id: 'deleteme', _type: 'foo'}]

const updated = applyInCollection(initial, [
  createIfNotExists({_id: 'mydocument', _type: 'foo'}),
  createIfNotExists({_id: 'anotherDocument', _type: 'foo'}),
  del('deleteme'),
])

console.log(updated)
