import {expect, test} from 'vitest'

import {at, patch} from '../../../mutations/creators'
import {insert, set, unset} from '../../../mutations/operations/creators'
import {decodeAll, type SanityMutation} from '../decode'

test('decode()', () => {
  const encoded: SanityMutation[] = [
    {
      patch: {
        id: 'cat',
        set: {
          title: 'hello world',
        },
      },
    },
    {
      patch: {
        id: 'cat',
        unset: ['title'],
      },
    },
    {
      patch: {
        id: 'cat',
        unset: ['hello'],
      },
    },
    {
      patch: {
        id: 'cat',
        set: {
          breed: 'forest cat',
        },
      },
    },
    {
      patch: {
        id: 'dog',
        insert: {
          after: 'characteristics[-1]',
          items: ['furry'],
        },
      },
    },
  ]
  expect(decodeAll(encoded)).toEqual([
    patch('cat', [at('title', set('hello world'))]),
    patch('cat', [at('title', unset())]),
    patch('cat', [at('hello', unset())]),
    patch('cat', [at('breed', set('forest cat'))]),
    patch('dog', [at('characteristics', insert(['furry'], 'after', -1))]),
  ])
})
