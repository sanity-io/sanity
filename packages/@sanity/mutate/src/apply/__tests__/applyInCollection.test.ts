import {expect, test} from 'vitest'

import {
  at,
  createIfNotExists,
  createOrReplace,
  del,
  patch,
} from '../../mutations/creators'
import {set, unset} from '../../mutations/operations/creators'
import {applyInCollection} from '../applyInCollection'

type FooDoc = {
  _id: 'foo'
  _type: string
  hello?: string
  nah?: string
}

test('createIfNotExists', () => {
  const docs: FooDoc[] = [{_id: 'foo', _type: 'test', hello: 'hi'}]

  const next: FooDoc = {_id: 'foo', _type: 'test', nah: 'nope'}

  expect(applyInCollection(docs, [createIfNotExists(next)]))
    // note the object identity should be equal mutation has no effect
    .toBe(docs)

  expect(applyInCollection([], [createIfNotExists(next)])).toEqual([
    {_id: 'foo', _type: 'test', nah: 'nope'},
  ])
})

test('createOrReplace', () => {
  const first = {_id: 'somedoc', _type: 'test', version: 'first'}
  const replaceWith = {_id: 'somedoc', _type: 'test', version: 'replaced!'}

  expect(applyInCollection([], [createOrReplace(first)])).toEqual([first])
  expect(applyInCollection([first], [createOrReplace(replaceWith)])).toEqual([
    replaceWith,
  ])
})

test('delete', () => {
  const collection = [{_id: 'hello', _type: 'test', hello: 'hi'}]
  expect(applyInCollection(collection, [del('foo')])).toBe(collection)
  expect(applyInCollection(collection, [del('hello')])).toEqual([])
})

test('patch set', () => {
  const collection = [
    {_id: 'another', _type: 'foobar'},
    {_id: 'foo', _type: 'test', hello: 'hi'},
  ]
  const mutations = [patch('foo', [at(['hello'], set('hi!'))])]
  expect(applyInCollection(collection, mutations)).toEqual([
    {_id: 'another', _type: 'foobar'},
    {
      _id: 'foo',
      _type: 'test',
      hello: 'hi!',
    },
  ])
})

test('patch unset', () => {
  const current = [{_id: 'foo', _type: 'test', hello: 'hi'}]
  const mutations = [patch('foo', at('hello', unset()))]
  expect(applyInCollection(current, mutations)).toEqual([
    {
      _id: 'foo',
      _type: 'test',
    },
  ])
})
