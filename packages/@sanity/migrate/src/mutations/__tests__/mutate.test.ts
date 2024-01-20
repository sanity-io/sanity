import {expect, test} from '@jest/globals'

import {at, create, createIfNotExists, createOrReplace, del, patch} from '../creators'
import {inc, insert, set, setIfMissing, unset} from '../operations/creators'

test('single patch mutation', () => {
  expect(patch('cat', at(['title'], set('hello world')))).toStrictEqual({
    id: 'cat',
    type: 'patch',
    patches: [
      {
        path: ['title'],
        op: {type: 'set', value: 'hello world'},
      },
    ],
  })
})

test('single create mutation', () => {
  expect(create({_id: 'cat', _type: 'hello'})).toStrictEqual({
    type: 'create',
    document: {_id: 'cat', _type: 'hello'},
  })
})

test('two patch mutations', () => {
  expect(
    patch('cat', [at(['title'], set('hello world')), at(['subtitle'], set('nice to see you'))]),
  ).toStrictEqual({
    type: 'patch',
    id: 'cat',
    patches: [
      {
        op: {
          type: 'set',
          value: 'hello world',
        },
        path: ['title'],
      },
      {
        op: {
          type: 'set',
          value: 'nice to see you',
        },
        path: ['subtitle'],
      },
    ],
  })
})

test('single patch with revision', () => {
  expect(patch('cat', at(['title'], set('hello world')), {ifRevision: 'rev0'})).toStrictEqual({
    type: 'patch',
    id: 'cat',
    options: {ifRevision: 'rev0'},
    patches: [
      {
        path: ['title'],
        op: {
          type: 'set',
          value: 'hello world',
        },
      },
    ],
  })
})

test('multiple mutations', () => {
  expect([
    createOrReplace({_id: 'foo', _type: 'lol', count: 1}),
    patch('foo', [at('title', set('hello')), at('count', inc(2))], {
      ifRevision: 'someRev',
    }),
  ]).toEqual([
    {
      type: 'createOrReplace',
      document: {
        _id: 'foo',
        _type: 'lol',
        count: 1,
      },
    },
    {
      type: 'patch',
      id: 'foo',
      options: {
        ifRevision: 'someRev',
      },
      patches: [
        {
          path: ['title'],
          op: {type: 'set', value: 'hello'},
        },
        {
          path: ['count'],
          op: {type: 'inc', amount: 2},
        },
      ],
    },
  ])
})

test('multiple ops in a single patch mutation', () => {
  expect([
    createIfNotExists({_id: 'foo', _type: 'lol', count: 1}),
    patch('foo', [at('title', set('hello')), at('count', inc(2))], {
      ifRevision: 'someRev',
    }),
  ]).toEqual([
    {
      type: 'createIfNotExists',
      document: {
        _id: 'foo',
        _type: 'lol',
        count: 1,
      },
    },
    {
      type: 'patch',
      id: 'foo',
      options: {ifRevision: 'someRev'},
      patches: [
        {
          path: ['title'],
          op: {
            type: 'set',
            value: 'hello',
          },
        },
        {
          path: ['count'],
          op: {
            type: 'inc',
            amount: 2,
          },
        },
      ],
    },
  ])
})

test('all permutations', () => {
  const mutations = [
    create({_id: 'foo', _type: 'foo', count: 0}),
    createIfNotExists({_id: 'bar', _type: 'bar', count: 1}),
    createOrReplace({_id: 'baz', _type: 'baz', count: 2}),
    patch(
      'qux',
      [
        at('title', set('hello')),
        at('items', setIfMissing([])),
        at('items', insert([1, 2, 3], 'after', 1)),
        at('title', unset()),
        at('count', inc(2)),
      ],
      {ifRevision: 'someRev'},
    ),
    patch('quux', [
      at('title', set('hello')),
      at('items', setIfMissing([])),
      at('items', insert([1, 2, 3], 'after', 0)),
      at('title', unset()),
      at('count', inc(2)),
    ]),
    del('quuz'),
    del('corge'),
  ]

  expect(mutations).toEqual([
    {
      type: 'create',
      document: {
        _id: 'foo',
        _type: 'foo',
        count: 0,
      },
    },
    {
      type: 'createIfNotExists',
      document: {
        _id: 'bar',
        _type: 'bar',
        count: 1,
      },
    },
    {
      type: 'createOrReplace',
      document: {
        _id: 'baz',
        _type: 'baz',
        count: 2,
      },
    },
    {
      type: 'patch',
      id: 'qux',
      patches: [
        {
          path: ['title'],
          op: {
            type: 'set',
            value: 'hello',
          },
        },
        {
          path: ['items'],
          op: {type: 'setIfMissing', value: []},
        },
        {
          op: {
            items: [1, 2, 3],
            position: 'after',
            referenceItem: 1,
            type: 'insert',
          },
          path: ['items'],
        },
        {path: ['title'], op: {type: 'unset'}},
        {path: ['count'], op: {amount: 2, type: 'inc'}},
      ],
      options: {
        ifRevision: 'someRev',
      },
    },
    {
      type: 'patch',
      id: 'quux',
      patches: [
        {
          path: ['title'],
          op: {
            type: 'set',
            value: 'hello',
          },
        },
        {
          path: ['items'],
          op: {
            type: 'setIfMissing',
            value: [],
          },
        },
        {
          path: ['items'],
          op: {
            type: 'insert',
            position: 'after',
            referenceItem: 0,
            items: [1, 2, 3],
          },
        },
        {
          path: ['title'],
          op: {type: 'unset'},
        },
        {
          path: ['count'],
          op: {
            type: 'inc',
            amount: 2,
          },
        },
      ],
    },
    {
      type: 'delete',
      id: 'quuz',
    },
    {
      type: 'delete',
      id: 'corge',
    },
  ])
})
