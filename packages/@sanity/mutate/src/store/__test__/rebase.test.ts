import {expect, test} from 'vitest'

import {at, patch} from '../../mutations/creators'
import {set} from '../../mutations/operations/creators'
import {rebase} from '../rebase'
import {type MutationGroup, type NonTransactionalMutationGroup} from '../types'

test('rebase() a simple case', () => {
  const oldRemote = {_id: 'test', _type: 'test', foo: 'bar\nbaz'}
  const newRemote = {_id: 'test', _type: 'test', foo: 'car\nbaz'}

  const staged = [
    {
      transaction: false,
      mutations: [patch('test', [at('foo', set('bar\nbat'))])],
    },
  ]

  const [nextPendingChanges, nextLocal] = rebase(
    'test',
    oldRemote,
    newRemote,
    staged,
  )
  expect(nextLocal).toEqual({_id: 'test', _type: 'test', foo: 'car\nbat'})

  expect(nextPendingChanges).toEqual([
    {
      transaction: false,
      mutations: [patch('test', [at('foo', set('car\nbat'))])],
    },
  ])
})

test('rebase() without pending mutations', () => {
  const oldRemote = {_id: 'test', _type: 'test', foo: 'bar\nbaz'}
  const newRemote = {_id: 'test', _type: 'test', foo: 'car\nbaz'}

  const staged: MutationGroup[] = []

  const [nextStage, nextLocal] = rebase('test', oldRemote, newRemote, staged)
  expect(nextLocal).toEqual(newRemote)

  expect(nextStage).toEqual([])
})

test('rebase() where a the new base has a deleted parent', () => {
  const oldBase = {
    _id: 'some-document',
    _type: 'person',
    content: {_type: 'code', language: 'js', text: 'foo bar'},
  }

  const newBase = {
    _id: 'some-document',
    _type: 'person',
  }

  const staged: NonTransactionalMutationGroup[] = [
    {
      transaction: false,
      mutations: [
        {
          type: 'createIfNotExists',
          document: {_id: 'some-document', _type: 'person'},
        },
        {
          type: 'patch',
          id: 'some-document',
          patches: [
            {
              path: ['content'],
              op: {type: 'setIfMissing', value: {_type: 'code'}},
            },
            {
              path: ['content', 'text'],
              op: {type: 'set', value: 'foo bar baz baez'},
            },
          ],
        },
      ],
    },
  ]

  const [nextStage, nextLocal] = rebase(
    'some-document',
    oldBase,
    newBase,
    staged,
  )
  expect(nextLocal).toEqual({
    _id: 'some-document',
    _type: 'person',
    content: {
      _type: 'code',
      text: 'foo bar baz baez',
    },
  })

  expect(nextStage).toEqual(staged)
})
