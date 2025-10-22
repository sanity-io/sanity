import {type SanityDocument} from '@sanity/client/csm'
import {lastValueFrom, map, type OperatorFunction, pipe, toArray} from 'rxjs'
import {expect, it} from 'vitest'

import {findDivergences} from './findDivergences'
import {hashData} from './utils/hash'

it('emits nothing if the required snapshots are missing', async () => {
  expect.assertions(1)

  const value = await lastValueFrom(
    findDivergences({
      upstreamAtFork: undefined,
      upstream: undefined,
      subject: undefined,
    }).pipe(toSortedArray()),
  )

  expect(value).toEqual([])
})

it('ignores divergences in system fields', async () => {
  const upstreamAtFork: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revA',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    _system: {
      someSystemValue: 'a',
    },
    someNonSystemField: 'a',
  }

  const upstream: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revB',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    _system: {
      someSystemField: 'b',
    },
    someNonSystemField: 'b',
  }

  const subject: SanityDocument = {
    _id: 'drafts.a',
    _type: 'article',
    _rev: 'revC',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    _system: {
      someSystemField: 'c',
    },
    someNonSystemField: 'c',
  }

  expect.assertions(1)

  const value = await lastValueFrom(
    findDivergences({
      upstreamAtFork,
      upstream,
      subject,
    }).pipe(toSortedArray()),
  )

  expect(value).toMatchInlineSnapshot(`
    [
      [
        "someNonSystemField",
        {
          "status": "unresolved",
        },
      ],
    ]
  `)
})

it('emits divergences that have been resolved', async () => {
  const upstreamAtFork: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revA',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someNonSystemField: 'a',
    somePrimitiveArray: ['a', 'b'],
    someObjectArray: [
      {_key: 'a', value: 'a'},
      {_key: 'b', value: 'b'},
    ],
  }

  const upstream: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revB',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someNonSystemField: 'c',
    somePrimitiveArray: ['b', 'c', 'a'],
    someObjectArray: [
      {_key: 'a', value: 'a1'},
      {_key: 'b', value: 'b1'},
    ],
  }

  const subject: SanityDocument = {
    _id: 'drafts.a',
    _type: 'article',
    _rev: 'revC',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someNonSystemField: 'b',
    somePrimitiveArray: ['a', 'b'],
    someObjectArray: [
      {_key: 'a', value: 'a'},
      {_key: 'b', value: 'b'},
    ],
  }

  expect.assertions(1)

  const value = await lastValueFrom(
    findDivergences({
      upstreamAtFork,
      upstream,
      subject,
      // All have up-to-date _rev and hash.
      resolutions: {
        'someNonSystemField': ['revB', await hashData('c')],
        'somePrimitiveArray': ['revB', await hashData(['b', 'c', 'a'])],
        'somePrimitiveArray[0]': ['revB', await hashData('b')],
        'somePrimitiveArray[1]': ['revB', await hashData('c')],
        'somePrimitiveArray[2]': ['revB', await hashData('a')],
        'someObjectArray': [
          'revB',
          await hashData([
            {_key: 'a', value: 'a1'},
            {_key: 'b', value: 'b1'},
          ]),
        ],
        'someObjectArray[_key=="a"]': ['revB', await hashData({_key: 'a', value: 'a1'})],
        'someObjectArray[_key=="a"].value': ['revB', await hashData('a1')],
        'someObjectArray[_key=="b"]': ['revB', await hashData({_key: 'b', value: 'b1'})],
        'someObjectArray[_key=="b"].value': ['revB', await hashData('bu1')],
      },
    }).pipe(toSortedArray()),
  )

  expect(value).toMatchInlineSnapshot(`
    [
      [
        "someNonSystemField",
        {
          "status": "resolved",
        },
      ],
      [
        "someObjectArray[_key=="a"].value",
        {
          "status": "resolved",
        },
      ],
      [
        "someObjectArray[_key=="b"].value",
        {
          "status": "resolved",
        },
      ],
      [
        "somePrimitiveArray[0]",
        {
          "status": "resolved",
        },
      ],
      [
        "somePrimitiveArray[1]",
        {
          "status": "resolved",
        },
      ],
      [
        "somePrimitiveArray[2]",
        {
          "status": "resolved",
        },
      ],
    ]
  `)
})

it('emits divergences that have been resolved if the _rev is stale but the hash matches', async () => {
  const upstreamAtFork: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revA',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    _system: {
      someSystemValue: 'a',
    },
    someNonSystemField: 'a',
  }

  const upstream: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revB',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    _system: {
      someSystemField: 'c',
    },
    someNonSystemField: 'c',
  }

  const subject: SanityDocument = {
    _id: 'drafts.a',
    _type: 'article',
    _rev: 'revC',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    _system: {
      someSystemField: 'b',
    },
    someNonSystemField: 'b',
  }

  expect.assertions(1)

  const value = await lastValueFrom(
    findDivergences({
      upstreamAtFork,
      upstream,
      subject,
      resolutions: {
        // Stale _rev, up-to-date hash.
        someNonSystemField: ['revA', await hashData('c')],
      },
    }).pipe(toSortedArray()),
  )

  expect(value).toMatchInlineSnapshot(`
    [
      [
        "someNonSystemField",
        {
          "status": "resolved",
        },
      ],
    ]
  `)
})

it('emits divergences that have stale resolutions', async () => {
  const upstreamAtFork: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revA',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    _system: {
      someSystemValue: 'a',
    },
    someNonSystemField: 'a',
  }

  const upstream: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revB',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    _system: {
      someSystemField: 'c',
    },
    someNonSystemField: 'c',
  }

  const subject: SanityDocument = {
    _id: 'drafts.a',
    _type: 'article',
    _rev: 'revC',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    _system: {
      someSystemField: 'b',
    },
    someNonSystemField: 'b',
  }

  expect.assertions(1)

  const value = await lastValueFrom(
    findDivergences({
      upstreamAtFork,
      upstream,
      subject,
      resolutions: {
        // Stale _rev and hash.
        someNonSystemField: ['revA', await hashData('a')],
      },
    }).pipe(toSortedArray()),
  )

  expect(value).toMatchInlineSnapshot(`
    [
      [
        "someNonSystemField",
        {
          "status": "unresolved",
        },
      ],
    ]
  `)
})

it('emits divergences when arrays of primitives have been reordered', async () => {
  const upstreamAtFork: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revA',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    somePrimitiveArray: ['a', 'b'],
  }

  const upstream: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revB',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    somePrimitiveArray: ['b', 'a'],
  }

  const subject: SanityDocument = {
    _id: 'drafts.a',
    _type: 'article',
    _rev: 'revC',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    somePrimitiveArray: ['a', 'b'],
  }

  expect.assertions(1)

  const value = await lastValueFrom(
    findDivergences({
      upstreamAtFork,
      upstream,
      subject,
    }).pipe(toSortedArray()),
  )

  expect(value).toMatchInlineSnapshot(`
    [
      [
        "somePrimitiveArray[0]",
        {
          "status": "unresolved",
        },
      ],
      [
        "somePrimitiveArray[1]",
        {
          "status": "unresolved",
        },
      ],
    ]
  `)
})

it.skip('emits divergences when arrays of objects have been reordered', async () => {
  const upstreamAtFork: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revA',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someObjectArray: [{_key: 'a'}, {_key: 'b'}],
  }

  const upstream: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revB',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someObjectArray: [{_key: 'b'}, {_key: 'a'}],
  }

  const subject: SanityDocument = {
    _id: 'drafts.a',
    _type: 'article',
    _rev: 'revC',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someObjectArray: [{_key: 'a'}, {_key: 'b'}],
  }

  expect.assertions(1)

  const value = await lastValueFrom(
    findDivergences({
      upstreamAtFork,
      upstream,
      subject,
    }).pipe(toSortedArray()),
  )

  // TODO: May become implicit, meaning `[]` emitted
  // instead of hashing content, hash count (and maybe keys in order they appear)
  // this would reflect addition, removal, and reorder
  //
  // however, addition and removal should already be account for, as divergences
  // will be emitted at those key-based paths
  expect(value).toMatchInlineSnapshot(`
    [
      [
        "someObjectArray",
        {
          "status": "unresolved",
        },
      ],
    ]
  `)
})

it('does not emit divergences if object fields have been reordered', async () => {
  const upstreamAtFork: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revA',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someObject: {
      a: 'b',
      c: 'd',
    },
  }

  const upstream: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revB',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someObject: {
      c: 'd',
      a: 'b',
    },
  }

  const subject: SanityDocument = {
    _id: 'drafts.a',
    _type: 'article',
    _rev: 'revC',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someObject: {
      a: 'b',
      c: 'd',
    },
  }

  expect.assertions(1)

  const value = await lastValueFrom(
    findDivergences({
      upstreamAtFork,
      upstream,
      subject,
    }).pipe(toSortedArray()),
  )

  expect(value).toEqual([])
})

it('emits divergences for fields in added objects', async () => {
  const upstreamAtFork: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revA',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
  }

  const upstream: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revB',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someObject: {
      b: 'b',
      c: 'd',
      e: {
        f: 'g',
      },
    },
  }

  const subject: SanityDocument = {
    _id: 'drafts.a',
    _type: 'article',
    _rev: 'revC',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
  }

  expect.assertions(1)

  const value = await lastValueFrom(
    findDivergences({
      upstreamAtFork,
      upstream,
      subject,
    }).pipe(toSortedArray()),
  )

  expect(value).toMatchInlineSnapshot(`
    [
      [
        "someObject.b",
        {
          "status": "unresolved",
        },
      ],
      [
        "someObject.c",
        {
          "status": "unresolved",
        },
      ],
      [
        "someObject.e.f",
        {
          "status": "unresolved",
        },
      ],
    ]
  `)
})

it('emits divergences for fields in removed objects', async () => {
  const upstreamAtFork: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revA',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someObject: {
      b: 'b',
      c: 'd',
      e: {
        f: 'g',
      },
    },
  }

  const upstream: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revB',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
  }

  const subject: SanityDocument = {
    _id: 'drafts.a',
    _type: 'article',
    _rev: 'revC',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
  }

  expect.assertions(1)

  const value = await lastValueFrom(
    findDivergences({
      upstreamAtFork,
      upstream,
      subject,
    }).pipe(toSortedArray()),
  )

  expect(value).toMatchInlineSnapshot(`
    [
      [
        "someObject.b",
        {
          "status": "unresolved",
        },
      ],
      [
        "someObject.c",
        {
          "status": "unresolved",
        },
      ],
      [
        "someObject.e.f",
        {
          "status": "unresolved",
        },
      ],
    ]
  `)
})

it('emits divergences for fields nullified objects', async () => {
  const upstreamAtFork: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revA',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someObject: {
      b: 'b',
      c: 'd',
      e: {
        f: 'g',
      },
    },
  }

  const upstream: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revB',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someObject: null,
  }

  const subject: SanityDocument = {
    _id: 'drafts.a',
    _type: 'article',
    _rev: 'revC',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
  }

  expect.assertions(1)

  const value = await lastValueFrom(
    findDivergences({
      upstreamAtFork,
      upstream,
      subject,
    }).pipe(toSortedArray()),
  )

  expect(value).toMatchInlineSnapshot(`
    [
      [
        "someObject",
        {
          "status": "unresolved",
        },
      ],
      [
        "someObject.b",
        {
          "status": "unresolved",
        },
      ],
      [
        "someObject.c",
        {
          "status": "unresolved",
        },
      ],
      [
        "someObject.e.f",
        {
          "status": "unresolved",
        },
      ],
    ]
  `)
})

it('emits divergences for fields in added primitive arrays', async () => {
  const upstreamAtFork: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revA',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
  }

  const upstream: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revB',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someArray: ['a', 'b', 'c'],
  }

  const subject: SanityDocument = {
    _id: 'drafts.a',
    _type: 'article',
    _rev: 'revC',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
  }

  expect.assertions(1)

  const value = await lastValueFrom(
    findDivergences({
      upstreamAtFork,
      upstream,
      subject,
    }).pipe(toSortedArray()),
  )

  expect(value).toMatchInlineSnapshot(`
    [
      [
        "someArray[0]",
        {
          "status": "unresolved",
        },
      ],
      [
        "someArray[1]",
        {
          "status": "unresolved",
        },
      ],
      [
        "someArray[2]",
        {
          "status": "unresolved",
        },
      ],
    ]
  `)
})

it('emits divergences for fields in removed primitive arrays', async () => {
  const upstreamAtFork: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revA',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someArray: ['a', 'b', 'c'],
  }

  const upstream: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revB',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
  }

  const subject: SanityDocument = {
    _id: 'drafts.a',
    _type: 'article',
    _rev: 'revC',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
  }

  expect.assertions(1)

  const value = await lastValueFrom(
    findDivergences({
      upstreamAtFork,
      upstream,
      subject,
    }).pipe(toSortedArray()),
  )

  expect(value).toMatchInlineSnapshot(`
    [
      [
        "someArray[0]",
        {
          "status": "unresolved",
        },
      ],
      [
        "someArray[1]",
        {
          "status": "unresolved",
        },
      ],
      [
        "someArray[2]",
        {
          "status": "unresolved",
        },
      ],
    ]
  `)
})

it('emits divergences for fields in nullified primitive arrays', async () => {
  const upstreamAtFork: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revA',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someArray: ['a', 'b', 'c'],
  }

  const upstream: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revB',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someArray: null,
  }

  const subject: SanityDocument = {
    _id: 'drafts.a',
    _type: 'article',
    _rev: 'revC',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
  }

  expect.assertions(1)

  const value = await lastValueFrom(
    findDivergences({
      upstreamAtFork,
      upstream,
      subject,
    }).pipe(
      toArray(),
      map((array) => array.toSorted()),
    ),
  )

  expect(value).toMatchInlineSnapshot(`
    [
      [
        "someArray",
        {
          "status": "unresolved",
        },
      ],
      [
        "someArray[0]",
        {
          "status": "unresolved",
        },
      ],
      [
        "someArray[1]",
        {
          "status": "unresolved",
        },
      ],
      [
        "someArray[2]",
        {
          "status": "unresolved",
        },
      ],
    ]
  `)
})

it('emits divergences for fields in added object arrays', async () => {
  const upstreamAtFork: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revA',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
  }

  const upstream: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revB',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someArray: [
      {_key: 'a', value: 'a1'},
      {_key: 'b', value: 'b1'},
      {_key: 'c', value: 'c1'},
    ],
  }

  const subject: SanityDocument = {
    _id: 'drafts.a',
    _type: 'article',
    _rev: 'revC',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
  }

  expect.assertions(1)

  const value = await lastValueFrom(
    findDivergences({
      upstreamAtFork,
      upstream,
      subject,
    }).pipe(toSortedArray()),
  )

  expect(value).toMatchInlineSnapshot(`
    [
      [
        "someArray[_key=="a"].value",
        {
          "status": "unresolved",
        },
      ],
      [
        "someArray[_key=="b"].value",
        {
          "status": "unresolved",
        },
      ],
      [
        "someArray[_key=="c"].value",
        {
          "status": "unresolved",
        },
      ],
    ]
  `)
})

it('emits divergences for fields in removed object arrays', async () => {
  const upstreamAtFork: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revA',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someArray: [
      {_key: 'a', value: 'a1'},
      {_key: 'b', value: 'b1'},
      {_key: 'c', value: 'c1'},
    ],
  }

  const upstream: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revB',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
  }

  const subject: SanityDocument = {
    _id: 'drafts.a',
    _type: 'article',
    _rev: 'revC',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
  }

  expect.assertions(1)

  const value = await lastValueFrom(
    findDivergences({
      upstreamAtFork,
      upstream,
      subject,
    }).pipe(toSortedArray()),
  )

  expect(value).toMatchInlineSnapshot(`
    [
      [
        "someArray[_key=="a"].value",
        {
          "status": "unresolved",
        },
      ],
      [
        "someArray[_key=="b"].value",
        {
          "status": "unresolved",
        },
      ],
      [
        "someArray[_key=="c"].value",
        {
          "status": "unresolved",
        },
      ],
    ]
  `)
})

it('emits divergences for fields in nullified object arrays', async () => {
  const upstreamAtFork: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revA',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someArray: [
      {_key: 'a', value: 'a1'},
      {_key: 'b', value: 'b1'},
      {_key: 'c', value: 'c1'},
    ],
  }

  const upstream: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revB',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someArray: null,
  }

  const subject: SanityDocument = {
    _id: 'drafts.a',
    _type: 'article',
    _rev: 'revC',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
  }

  expect.assertions(1)

  const value = await lastValueFrom(
    findDivergences({
      upstreamAtFork,
      upstream,
      subject,
    }).pipe(toSortedArray()),
  )

  expect(value).toMatchInlineSnapshot(`
    [
      [
        "someArray",
        {
          "status": "unresolved",
        },
      ],
      [
        "someArray[_key=="a"].value",
        {
          "status": "unresolved",
        },
      ],
      [
        "someArray[_key=="b"].value",
        {
          "status": "unresolved",
        },
      ],
      [
        "someArray[_key=="c"].value",
        {
          "status": "unresolved",
        },
      ],
    ]
  `)
})

function toSortedArray<Type>(): OperatorFunction<Type, Type[]> {
  return pipe(
    toArray(),
    map((array) => array.toSorted()),
  )
}
