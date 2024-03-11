import {at, patch, upsert} from '@sanity/mutate'
import {applyInCollection} from '@sanity/mutate/_unstable_apply'

type Doc = {_id: string; _type: string; array: any[]}
const doc: Doc = {
  _id: 'some-document',
  _type: 'test',
  array: [{_key: 'existing', value: 'test'}],
}

const result = applyInCollection(
  [doc],
  [
    patch(
      'some-document',
      at('array', upsert([{_key: 'existing', value: 'updated'}], 'after', -1)),
    ),
    patch(
      'some-document',
      at(
        'array',
        upsert([{_key: 'nonexisting', value: 'not exists'}], 'after', {
          _key: 'existing',
        }),
      ),
    ),
  ],
)

console.log(result[0])
