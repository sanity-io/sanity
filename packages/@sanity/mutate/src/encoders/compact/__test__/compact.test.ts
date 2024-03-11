import {expect, test} from 'vitest'

import {at, createIfNotExists, patch} from '../../../mutations/creators'
import {set, unset} from '../../../mutations/operations/creators'
import {decode} from '../decode'
import {encode} from '../encode'

test('encode', () => {
  expect(
    encode([
      createIfNotExists({_id: 'cat', _type: 'cat'}),
      patch('cat', [
        at('title', set('hello world')),
        at('breed.name', set('common house cat')),
        at('title', unset()),
        at('hello', unset()),
      ]),
      patch('cat', [at('breed', set('forest cat'))]),
      patch('other', [at('sound', set('meow'))], {ifRevision: 'rev004'}),
    ]),
  ).toStrictEqual([
    ['createIfNotExists', {_id: 'cat', _type: 'cat'}],
    ['patch', 'set', 'cat', 'title', ['hello world']],
    ['patch', 'set', 'cat', 'breed.name', ['common house cat']],
    ['patch', 'unset', 'cat', 'title', []],
    ['patch', 'unset', 'cat', 'hello', []],
    ['patch', 'set', 'cat', 'breed', ['forest cat']],
    ['patch', 'set', 'other', 'sound', ['meow'], 'rev004'],
  ])
})

test('decode', () => {
  expect(
    decode([
      ['createIfNotExists', {_id: 'cat', _type: 'cat'}],
      ['patch', 'set', 'cat', 'title', ['hello world']],
      ['patch', 'set', 'cat', 'breed.name', ['common house cat']],
      ['patch', 'unset', 'cat', 'title', []],
      ['patch', 'unset', 'cat', 'hello', []],
      ['patch', 'set', 'cat', 'breed', ['forest cat']],
      ['patch', 'set', 'other', 'sound', ['meow'], 'rev004'],
    ]),
  ).toEqual([
    {
      document: {
        _id: 'cat',
        _type: 'cat',
      },
      type: 'createIfNotExists',
    },
    {
      id: 'cat',
      patches: [
        {
          op: {
            type: 'set',
            value: 'hello world',
          },
          path: ['title'],
        },
      ],
      type: 'patch',
    },
    {
      id: 'cat',
      patches: [
        {
          op: {
            type: 'set',
            value: 'common house cat',
          },
          path: ['breed', 'name'],
        },
      ],
      type: 'patch',
    },
    {
      id: 'cat',
      patches: [
        {
          op: {
            type: 'unset',
          },
          path: ['title'],
        },
      ],
      type: 'patch',
    },
    {
      id: 'cat',
      patches: [
        {
          op: {
            type: 'unset',
          },
          path: ['hello'],
        },
      ],
      type: 'patch',
    },
    {
      id: 'cat',
      patches: [
        {
          op: {
            type: 'set',
            value: 'forest cat',
          },
          path: ['breed'],
        },
      ],
      type: 'patch',
    },
    {
      id: 'other',
      options: {
        ifRevision: 'rev004',
      },
      patches: [
        {
          op: {
            type: 'set',
            value: 'meow',
          },
          path: ['sound'],
        },
      ],
      type: 'patch',
    },
  ])
})
