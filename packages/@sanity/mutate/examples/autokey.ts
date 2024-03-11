import {autoKeys} from '@sanity/mutate'
import {applyInCollection} from '@sanity/mutate/_unstable_apply'
import {ulid} from 'ulid'

import {at, patch} from '../src'

type Item = {_key?: string; order: string}
const {insert} = autoKeys<Item>(item => ulid())

type Doc = {_id: string; _type: string; array: any[]}
const doc: Doc = {_id: 'some-document', _type: 'test', array: []}

const result = applyInCollection(
  [doc],
  [
    patch(
      'some-document',
      at('array', insert('after', -1, [{order: 'second'}])),
    ),
  ],
)

console.log(result)
