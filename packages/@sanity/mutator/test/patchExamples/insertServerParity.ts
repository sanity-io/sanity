import {type InsertPatch} from '@sanity/types'

import {type PatchExample} from './types'

// Results of `insert` patches as applied by the Sanity API, for each location and path
// shape. The mutator must produce the same result.
const inputs: Record<string, unknown[]> = {
  array: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  keyed: [
    {_key: 'a', i: 0},
    {_key: 'a', i: 1},
    {_key: 'b', i: 2},
    {_key: 'a', i: 3},
  ],
  empty: [],
}

const items = ['X', 'Y']

const serverResults: {
  op: 'before' | 'after' | 'replace'
  path: string
  field: string
  result: unknown[]
}[] = [
  {
    op: 'before',
    path: 'array[0]',
    field: 'array',
    result: ['X', 'Y', 0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  },
  {
    op: 'before',
    path: 'array[1]',
    field: 'array',
    result: [0, 'X', 'Y', 1, 2, 3, 4, 5, 6, 7, 8, 9],
  },
  {
    op: 'before',
    path: 'array[9]',
    field: 'array',
    result: [0, 1, 2, 3, 4, 5, 6, 7, 8, 'X', 'Y', 9],
  },
  {
    op: 'before',
    path: 'array[-1]',
    field: 'array',
    result: [0, 1, 2, 3, 4, 5, 6, 7, 8, 'X', 'Y', 9],
  },
  {
    op: 'before',
    path: 'array[-3]',
    field: 'array',
    result: [0, 1, 2, 3, 4, 5, 6, 'X', 'Y', 7, 8, 9],
  },
  {op: 'before', path: 'array[10]', field: 'array', result: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]},
  {
    op: 'before',
    path: 'array[1,3]',
    field: 'array',
    result: [0, 'X', 'Y', 1, 2, 3, 4, 5, 6, 7, 8, 9],
  },
  {
    op: 'before',
    path: 'array[3,1]',
    field: 'array',
    result: [0, 'X', 'Y', 1, 2, 3, 4, 5, 6, 7, 8, 9],
  },
  {
    op: 'before',
    path: 'array[1,2]',
    field: 'array',
    result: [0, 'X', 'Y', 1, 2, 3, 4, 5, 6, 7, 8, 9],
  },
  {
    op: 'before',
    path: 'array[1,1]',
    field: 'array',
    result: [0, 'X', 'Y', 1, 2, 3, 4, 5, 6, 7, 8, 9],
  },
  {
    op: 'before',
    path: 'array[@ < 2]',
    field: 'array',
    result: ['X', 'Y', 0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  },
  {
    op: 'before',
    path: 'array[@ == 1, @ == 2]',
    field: 'array',
    result: [0, 'X', 'Y', 1, 2, 3, 4, 5, 6, 7, 8, 9],
  },
  {op: 'before', path: 'array[@ > 100]', field: 'array', result: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]},
  {
    op: 'before',
    path: 'array[1:3]',
    field: 'array',
    result: [0, 'X', 'Y', 1, 2, 3, 4, 5, 6, 7, 8, 9],
  },
  {
    op: 'before',
    path: 'array[:2]',
    field: 'array',
    result: ['X', 'Y', 0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  },
  {
    op: 'before',
    path: 'array[-2:]',
    field: 'array',
    result: [0, 1, 2, 3, 4, 5, 6, 7, 'X', 'Y', 8, 9],
  },
  {
    op: 'before',
    path: 'array[8:]',
    field: 'array',
    result: [0, 1, 2, 3, 4, 5, 6, 7, 'X', 'Y', 8, 9],
  },
  {
    op: 'before',
    path: 'array[2:2]',
    field: 'array',
    result: [0, 1, 'X', 'Y', 2, 3, 4, 5, 6, 7, 8, 9],
  },
  {
    op: 'before',
    path: 'array[0:0]',
    field: 'array',
    result: ['X', 'Y', 0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  },
  {
    op: 'before',
    path: 'array[100:]',
    field: 'array',
    result: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'X', 'Y'],
  },
  {
    op: 'before',
    path: 'array[10:]',
    field: 'array',
    result: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'X', 'Y'],
  },
  {
    op: 'before',
    path: 'array[1:3, 5]',
    field: 'array',
    result: [0, 'X', 'Y', 1, 2, 3, 4, 5, 6, 7, 8, 9],
  },
  {
    op: 'before',
    path: 'array[1:3, 2]',
    field: 'array',
    result: [0, 'X', 'Y', 1, 2, 3, 4, 5, 6, 7, 8, 9],
  },
  {
    op: 'before',
    path: 'array[0:2, 2:4]',
    field: 'array',
    result: ['X', 'Y', 0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  },
  {
    op: 'before',
    path: 'array[1:3, 3]',
    field: 'array',
    result: [0, 'X', 'Y', 1, 2, 3, 4, 5, 6, 7, 8, 9],
  },
  {
    op: 'before',
    path: 'array[5, 1:3]',
    field: 'array',
    result: [0, 'X', 'Y', 1, 2, 3, 4, 5, 6, 7, 8, 9],
  },
  {
    op: 'before',
    path: 'keyed[_key=="a"]',
    field: 'keyed',
    result: ['X', 'Y', {_key: 'a', i: 0}, {_key: 'a', i: 1}, {_key: 'b', i: 2}, {_key: 'a', i: 3}],
  },
  {
    op: 'before',
    path: 'keyed[_key=="b"]',
    field: 'keyed',
    result: [{_key: 'a', i: 0}, {_key: 'a', i: 1}, 'X', 'Y', {_key: 'b', i: 2}, {_key: 'a', i: 3}],
  },
  {
    op: 'before',
    path: 'keyed[_key=="a", _key=="b"]',
    field: 'keyed',
    result: ['X', 'Y', {_key: 'a', i: 0}, {_key: 'a', i: 1}, {_key: 'b', i: 2}, {_key: 'a', i: 3}],
  },
  {
    op: 'before',
    path: 'keyed[_key=="zz"]',
    field: 'keyed',
    result: [
      {_key: 'a', i: 0},
      {_key: 'a', i: 1},
      {_key: 'b', i: 2},
      {_key: 'a', i: 3},
    ],
  },
  {op: 'before', path: 'empty[0]', field: 'empty', result: ['X', 'Y']},
  {op: 'before', path: 'empty[-1]', field: 'empty', result: ['X', 'Y']},
  {op: 'before', path: 'empty[0:]', field: 'empty', result: ['X', 'Y']},
  {op: 'before', path: 'empty[:]', field: 'empty', result: ['X', 'Y']},
  {op: 'after', path: 'array[0]', field: 'array', result: [0, 'X', 'Y', 1, 2, 3, 4, 5, 6, 7, 8, 9]},
  {op: 'after', path: 'array[1]', field: 'array', result: [0, 1, 'X', 'Y', 2, 3, 4, 5, 6, 7, 8, 9]},
  {op: 'after', path: 'array[9]', field: 'array', result: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'X', 'Y']},
  {
    op: 'after',
    path: 'array[-1]',
    field: 'array',
    result: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'X', 'Y'],
  },
  {
    op: 'after',
    path: 'array[-3]',
    field: 'array',
    result: [0, 1, 2, 3, 4, 5, 6, 7, 'X', 'Y', 8, 9],
  },
  {op: 'after', path: 'array[10]', field: 'array', result: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]},
  {
    op: 'after',
    path: 'array[1,3]',
    field: 'array',
    result: [0, 1, 2, 3, 'X', 'Y', 4, 5, 6, 7, 8, 9],
  },
  {
    op: 'after',
    path: 'array[3,1]',
    field: 'array',
    result: [0, 1, 2, 3, 'X', 'Y', 4, 5, 6, 7, 8, 9],
  },
  {
    op: 'after',
    path: 'array[1,2]',
    field: 'array',
    result: [0, 1, 2, 'X', 'Y', 3, 4, 5, 6, 7, 8, 9],
  },
  {
    op: 'after',
    path: 'array[1,1]',
    field: 'array',
    result: [0, 1, 'X', 'Y', 2, 3, 4, 5, 6, 7, 8, 9],
  },
  {
    op: 'after',
    path: 'array[@ < 2]',
    field: 'array',
    result: [0, 1, 'X', 'Y', 2, 3, 4, 5, 6, 7, 8, 9],
  },
  {
    op: 'after',
    path: 'array[@ == 1, @ == 2]',
    field: 'array',
    result: [0, 1, 2, 'X', 'Y', 3, 4, 5, 6, 7, 8, 9],
  },
  {op: 'after', path: 'array[@ > 100]', field: 'array', result: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]},
  {
    op: 'after',
    path: 'array[1:3]',
    field: 'array',
    result: [0, 1, 2, 'X', 'Y', 3, 4, 5, 6, 7, 8, 9],
  },
  {
    op: 'after',
    path: 'array[:2]',
    field: 'array',
    result: [0, 1, 'X', 'Y', 2, 3, 4, 5, 6, 7, 8, 9],
  },
  {
    op: 'after',
    path: 'array[-2:]',
    field: 'array',
    result: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'X', 'Y'],
  },
  {
    op: 'after',
    path: 'array[8:]',
    field: 'array',
    result: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'X', 'Y'],
  },
  {
    op: 'after',
    path: 'array[2:2]',
    field: 'array',
    result: [0, 1, 'X', 'Y', 2, 3, 4, 5, 6, 7, 8, 9],
  },
  {
    op: 'after',
    path: 'array[0:0]',
    field: 'array',
    result: ['X', 'Y', 0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  },
  {
    op: 'after',
    path: 'array[100:]',
    field: 'array',
    result: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'X', 'Y'],
  },
  {
    op: 'after',
    path: 'array[10:]',
    field: 'array',
    result: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'X', 'Y'],
  },
  {
    op: 'after',
    path: 'array[1:3, 5]',
    field: 'array',
    result: [0, 1, 2, 3, 4, 5, 'X', 'Y', 6, 7, 8, 9],
  },
  {
    op: 'after',
    path: 'array[1:3, 2]',
    field: 'array',
    result: [0, 1, 2, 'X', 'Y', 3, 4, 5, 6, 7, 8, 9],
  },
  {
    op: 'after',
    path: 'array[0:2, 2:4]',
    field: 'array',
    result: [0, 1, 2, 3, 'X', 'Y', 4, 5, 6, 7, 8, 9],
  },
  {
    op: 'after',
    path: 'array[1:3, 3]',
    field: 'array',
    result: [0, 1, 2, 3, 'X', 'Y', 4, 5, 6, 7, 8, 9],
  },
  {
    op: 'after',
    path: 'array[5, 1:3]',
    field: 'array',
    result: [0, 1, 2, 3, 4, 5, 'X', 'Y', 6, 7, 8, 9],
  },
  {
    op: 'after',
    path: 'keyed[_key=="a"]',
    field: 'keyed',
    result: [{_key: 'a', i: 0}, {_key: 'a', i: 1}, {_key: 'b', i: 2}, {_key: 'a', i: 3}, 'X', 'Y'],
  },
  {
    op: 'after',
    path: 'keyed[_key=="b"]',
    field: 'keyed',
    result: [{_key: 'a', i: 0}, {_key: 'a', i: 1}, {_key: 'b', i: 2}, 'X', 'Y', {_key: 'a', i: 3}],
  },
  {
    op: 'after',
    path: 'keyed[_key=="a", _key=="b"]',
    field: 'keyed',
    result: [{_key: 'a', i: 0}, {_key: 'a', i: 1}, {_key: 'b', i: 2}, {_key: 'a', i: 3}, 'X', 'Y'],
  },
  {
    op: 'after',
    path: 'keyed[_key=="zz"]',
    field: 'keyed',
    result: [
      {_key: 'a', i: 0},
      {_key: 'a', i: 1},
      {_key: 'b', i: 2},
      {_key: 'a', i: 3},
    ],
  },
  {op: 'after', path: 'empty[0]', field: 'empty', result: ['X', 'Y']},
  {op: 'after', path: 'empty[-1]', field: 'empty', result: ['X', 'Y']},
  {op: 'after', path: 'empty[0:]', field: 'empty', result: ['X', 'Y']},
  {op: 'after', path: 'empty[:]', field: 'empty', result: ['X', 'Y']},
  {op: 'replace', path: 'array[0]', field: 'array', result: ['X', 'Y', 1, 2, 3, 4, 5, 6, 7, 8, 9]},
  {op: 'replace', path: 'array[1]', field: 'array', result: [0, 'X', 'Y', 2, 3, 4, 5, 6, 7, 8, 9]},
  {op: 'replace', path: 'array[9]', field: 'array', result: [0, 1, 2, 3, 4, 5, 6, 7, 8, 'X', 'Y']},
  {op: 'replace', path: 'array[-1]', field: 'array', result: [0, 1, 2, 3, 4, 5, 6, 7, 8, 'X', 'Y']},
  {op: 'replace', path: 'array[-3]', field: 'array', result: [0, 1, 2, 3, 4, 5, 6, 'X', 'Y', 8, 9]},
  {op: 'replace', path: 'array[10]', field: 'array', result: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]},
  {
    op: 'replace',
    path: 'array[1,3]',
    field: 'array',
    result: [0, 'X', 'Y', 2, 'X', 'Y', 4, 5, 6, 7, 8, 9],
  },
  {
    op: 'replace',
    path: 'array[3,1]',
    field: 'array',
    result: [0, 'X', 'Y', 2, 'X', 'Y', 4, 5, 6, 7, 8, 9],
  },
  {
    op: 'replace',
    path: 'array[1,2]',
    field: 'array',
    result: [0, 'X', 'Y', 'X', 'Y', 3, 4, 5, 6, 7, 8, 9],
  },
  {
    op: 'replace',
    path: 'array[1,1]',
    field: 'array',
    result: [0, 'X', 'Y', 2, 3, 4, 5, 6, 7, 8, 9],
  },
  {
    op: 'replace',
    path: 'array[@ < 2]',
    field: 'array',
    result: ['X', 'Y', 'X', 'Y', 2, 3, 4, 5, 6, 7, 8, 9],
  },
  {
    op: 'replace',
    path: 'array[@ == 1, @ == 2]',
    field: 'array',
    result: [0, 'X', 'Y', 'X', 'Y', 3, 4, 5, 6, 7, 8, 9],
  },
  {op: 'replace', path: 'array[@ > 100]', field: 'array', result: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]},
  {op: 'replace', path: 'array[1:3]', field: 'array', result: [0, 'X', 'Y', 3, 4, 5, 6, 7, 8, 9]},
  {op: 'replace', path: 'array[:2]', field: 'array', result: ['X', 'Y', 2, 3, 4, 5, 6, 7, 8, 9]},
  {op: 'replace', path: 'array[-2:]', field: 'array', result: [0, 1, 2, 3, 4, 5, 6, 7, 'X', 'Y']},
  {op: 'replace', path: 'array[8:]', field: 'array', result: [0, 1, 2, 3, 4, 5, 6, 7, 'X', 'Y']},
  {
    op: 'replace',
    path: 'array[2:2]',
    field: 'array',
    result: [0, 1, 'X', 'Y', 2, 3, 4, 5, 6, 7, 8, 9],
  },
  {
    op: 'replace',
    path: 'array[0:0]',
    field: 'array',
    result: ['X', 'Y', 0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  },
  {
    op: 'replace',
    path: 'array[100:]',
    field: 'array',
    result: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'X', 'Y'],
  },
  {
    op: 'replace',
    path: 'array[10:]',
    field: 'array',
    result: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'X', 'Y'],
  },
  {
    op: 'replace',
    path: 'array[1:3, 5]',
    field: 'array',
    result: [0, 'X', 'Y', 3, 4, 'X', 'Y', 6, 7, 8, 9],
  },
  {
    op: 'replace',
    path: 'array[1:3, 2]',
    field: 'array',
    result: [0, 'X', 'Y', 3, 4, 5, 6, 7, 8, 9],
  },
  {
    op: 'replace',
    path: 'array[0:2, 2:4]',
    field: 'array',
    result: ['X', 'Y', 'X', 'Y', 4, 5, 6, 7, 8, 9],
  },
  {
    op: 'replace',
    path: 'array[1:3, 3]',
    field: 'array',
    result: [0, 'X', 'Y', 'X', 'Y', 4, 5, 6, 7, 8, 9],
  },
  {
    op: 'replace',
    path: 'array[5, 1:3]',
    field: 'array',
    result: [0, 'X', 'Y', 3, 4, 'X', 'Y', 6, 7, 8, 9],
  },
  {
    op: 'replace',
    path: 'keyed[_key=="a"]',
    field: 'keyed',
    result: ['X', 'Y', 'X', 'Y', {_key: 'b', i: 2}, 'X', 'Y'],
  },
  {
    op: 'replace',
    path: 'keyed[_key=="b"]',
    field: 'keyed',
    result: [{_key: 'a', i: 0}, {_key: 'a', i: 1}, 'X', 'Y', {_key: 'a', i: 3}],
  },
  {
    op: 'replace',
    path: 'keyed[_key=="a", _key=="b"]',
    field: 'keyed',
    result: ['X', 'Y', 'X', 'Y', 'X', 'Y', 'X', 'Y'],
  },
  {
    op: 'replace',
    path: 'keyed[_key=="zz"]',
    field: 'keyed',
    result: [
      {_key: 'a', i: 0},
      {_key: 'a', i: 1},
      {_key: 'b', i: 2},
      {_key: 'a', i: 3},
    ],
  },
  {op: 'replace', path: 'empty[0]', field: 'empty', result: ['X', 'Y']},
  {op: 'replace', path: 'empty[-1]', field: 'empty', result: ['X', 'Y']},
  {op: 'replace', path: 'empty[0:]', field: 'empty', result: ['X', 'Y']},
  {op: 'replace', path: 'empty[:]', field: 'empty', result: ['X', 'Y']},
]

// The jsonpath parser reads `[:]` as an empty union, so the patch never reaches the array and
// the mutator leaves it untouched where the server inserts. These rows pin the current result.
const differsFromServer = new Set(['empty[:]'])

function toInsert(op: 'before' | 'after' | 'replace', path: string): InsertPatch {
  if (op === 'before') return {before: path, items}
  if (op === 'after') return {after: path, items}
  return {replace: path, items}
}

const examples: PatchExample[] = serverResults.map(({op, path, field, result}) =>
  differsFromServer.has(path)
    ? {
        name: `Insert ${op} ${path} differs from the server and leaves the array untouched`,
        before: {[field]: structuredClone(inputs[field])},
        patch: {id: 'a', insert: toInsert(op, path)},
        after: {[field]: inputs[field]},
      }
    : {
        name: `Insert ${op} ${path} matches the server`,
        before: {[field]: structuredClone(inputs[field])},
        patch: {id: 'a', insert: toInsert(op, path)},
        after: {[field]: result},
      },
)

export default examples
