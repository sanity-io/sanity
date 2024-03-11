import {expect, test} from 'vitest'

import {at, createIfNotExists, del, patch} from '../../mutations/creators'
import {set} from '../../mutations/operations/creators'
import {
  squashMutationGroups,
  squashMutations,
} from '../optimizations/squashMutations'
import {chunkWhile} from '../utils/mergeMutationGroups'

test('squashMutations() merges subsequent patch mutations for the same document', () => {
  const mutations = [
    patch('test', [at('foo', set('a')), at('foo', set('ab'))]),
    patch('test', [at('bar', set('xyz')), at('y', set('y'))]),
  ]
  expect(squashMutations(mutations)).toEqual([
    patch('test', [
      at('foo', set('a')),
      at('foo', set('ab')),
      at('bar', set('xyz')),
      at('y', set('y')),
    ]),
  ])
})

test('squashMutations() merges subsequent patch mutations for the same document', () => {
  const mutations = [
    patch('doc1', [at('foo', set('a'))]),
    patch('doc2', [at('bar', set('xyz'))]),
    patch('doc1', [at('x', set('x'))]),
  ]

  expect(squashMutations(mutations)).toEqual([
    patch('doc1', [at('foo', set('a')), at('x', set('x'))]),
    patch('doc2', [at('bar', set('xyz'))]),
  ])
})

test('squashMutations() removes intermittent createIfNotExists', () => {
  const mutations = [
    createIfNotExists({_id: 'doc1', _type: 'foo'}),
    patch('doc1', [at('foo', set('a'))]),
    createIfNotExists({_id: 'doc1', _type: 'foo'}),
    patch('doc1', [at('bar', set('xyz'))]),
    createIfNotExists({_id: 'doc1', _type: 'foo'}),
    patch('doc1', [at('x', set('x'))]),
  ]

  expect(squashMutations(mutations)).toEqual([
    createIfNotExists({_id: 'doc1', _type: 'foo'}),
    patch('doc1', [
      at('foo', set('a')),
      at('bar', set('xyz')),
      at('x', set('x')),
    ]),
  ])
})

test('squashMutations() removes mutations before delete()', () => {
  const mutations = [
    createIfNotExists({_id: 'doc1', _type: 'foo'}),
    patch('doc1', [at('foo', set('a'))]),
    createIfNotExists({_id: 'doc1', _type: 'foo'}),
    del('doc1'),
    createIfNotExists({_id: 'doc1', _type: 'foo'}),
    patch('doc1', [at('x', set('x'))]),
  ]

  expect(squashMutations(mutations)).toEqual([
    del('doc1'),
    createIfNotExists({_id: 'doc1', _type: 'foo'}),
    patch('doc1', [at('x', set('x'))]),
  ])
})

test('squashMutationGroups() for a simple transaction', () => {
  const mutations = [
    patch('test', [
      at('foo', set('a')),
      at('foo', set('ab')),
      at('foo', set('abc')),
      at('foo', set('abcd')),
      at('foo', set('abcde')),
    ]),
  ]

  expect(squashMutationGroups([{transaction: true, mutations}])).toEqual([
    {
      transaction: true,
      mutations: [patch('test', [at('foo', set('abcde'))])],
    },
  ])
})

test('chunkWhile', () => {
  expect(
    chunkWhile(['a', 'ab', 'b', 'abc', 'a', 'b'], s => s[0] === 'a'),
  ).toEqual([['a', 'ab'], ['b'], ['abc', 'a'], ['b']])
})
