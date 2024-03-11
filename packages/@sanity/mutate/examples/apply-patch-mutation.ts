import {
  append,
  assign,
  at,
  insert,
  insertAfter,
  insertBefore,
  patch,
  prepend,
  setIfMissing,
  unassign,
  unset,
} from '@sanity/mutate'
import {applyPatchMutation} from '@sanity/mutate/_unstable_apply'

const document = {
  _id: 'test',
  _type: 'foo',
  unsetme: 'yes',
  unassignme: 'please',
  assigned: {existing: 'prop'},
} as const

const patches = patch('test', [
  at([], setIfMissing({title: 'Foo'})),
  at([], setIfMissing({cities: []})),
  at('cities', insert(['Oslo', 'San Francisco'], 'after', 0)),
  at('cities', prepend(['Krakow'])),
  at('cities', append(['Askim'])),
  at('cities', insertAfter(['Chicago'], 1)),
  at('cities', insertBefore(['Raleigh'], 3)),
  at('unsetme', unset()),
  at([], unassign(['unassignme'])),
  at('hmmm', assign({other: 'value'})),
])

const updated = applyPatchMutation(patches, document)

console.log(updated)
