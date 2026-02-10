import {type SanityDocument} from '@sanity/client/csm'
import {lastValueFrom, map, type OperatorFunction, pipe, toArray} from 'rxjs'
import {expect, it} from 'vitest'

import {type DivergenceAtPath, readDocumentDivergences} from './readDocumentDivergences'
import {hashData} from './utils/hashData'
import {keyArray} from './utils/keyArray'

it('emits nothing if the required snapshots are missing', async () => {
  expect.assertions(1)

  const value = await lastValueFrom(
    readDocumentDivergences({
      // @ts-expect-error contrived runtime error
      upstreamAtFork: undefined,
      // @ts-expect-error contrived runtime error
      upstreamHead: undefined,
      // @ts-expect-error contrived runtime error
      subjectHead: undefined,
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

  const upstreamHead: SanityDocument = {
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

  const subjectHead: SanityDocument = {
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
    readDocumentDivergences({
      upstreamAtFork,
      upstreamHead,
      subjectHead,
    }).pipe(toSortedArray()),
  )

  expect(value).toMatchInlineSnapshot(`
    [
      [
        "someNonSystemField",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "set",
          "isAddressable": true,
          "path": "someNonSystemField",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someNonSystemField",
                  },
                  "type": "string",
                },
              ],
              "value": "c",
            },
            "upstreamAtFork": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someNonSystemField",
                  },
                  "type": "string",
                },
              ],
              "value": "a",
            },
            "upstreamHead": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someNonSystemField",
                  },
                  "type": "string",
                },
              ],
              "value": "b",
            },
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
    ]
  `)
})

it('emits only a divergences on the object when upstream object type has changed, and matches subject object type', async () => {
  const upstreamAtFork: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revA',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someObjectArray: [
      {
        _key: 'a',
        _type: 'alpha',
        value: 'someString',
        someAlphaValue: 'a',
        someSharedValue: 'a',
      },
    ],
  }

  const upstreamHead: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revB',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someObjectArray: [
      {
        _key: 'a',
        someBetaValue: 'b',
        someSharedValue: 'b',
        _type: 'beta',
      },
    ],
  }

  const subjectHead: SanityDocument = {
    _id: 'drafts.a',
    _type: 'article',
    _rev: 'revC',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someObjectArray: [
      {
        _key: 'a',
        value: 'someString',
        _type: 'alpha',
      },
    ],
  }

  expect.assertions(1)

  const value = await lastValueFrom(
    readDocumentDivergences({
      upstreamAtFork,
      upstreamHead,
      subjectHead,
    }).pipe(toSortedArray()),
  )

  expect(value).toMatchInlineSnapshot(`
    [
      [
        "someObjectArray[_key=="a"]",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "changeObjectType",
          "isAddressable": true,
          "path": "someObjectArray[_key=="a"]",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": {
              "parentArray": undefined,
              "parentObjectType": "alpha",
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObjectArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "a",
                  },
                  "type": "alpha",
                },
                {
                  "segment": {
                    "_key": "_type",
                  },
                  "type": "string",
                },
              ],
              "value": "alpha",
            },
            "upstreamAtFork": {
              "parentArray": undefined,
              "parentObjectType": "alpha",
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObjectArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "a",
                  },
                  "type": "alpha",
                },
                {
                  "segment": {
                    "_key": "_type",
                  },
                  "type": "string",
                },
              ],
              "value": "alpha",
            },
            "upstreamHead": {
              "parentArray": undefined,
              "parentObjectType": "beta",
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObjectArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "a",
                  },
                  "type": "beta",
                },
                {
                  "segment": {
                    "_key": "_type",
                  },
                  "type": "string",
                },
              ],
              "value": "beta",
            },
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
    ]
  `)
})

it('emits only a divergences on the object when upstream object type has changed since resolution, and matches subject object type', async () => {
  const upstreamAtFork: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revA',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someObjectArray: [
      {
        _key: 'a',
        _type: 'alpha',
        value: 'someString',
        someAlphaValue: 'a',
        someSharedValue: 'a',
      },
    ],
  }

  const upstreamHead: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revB',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someObjectArray: [
      {
        _key: 'a',
        _type: 'beta',
        someBetaValue: 'b',
        someSharedValue: 'b',
      },
    ],
  }

  const subjectHead: SanityDocument = {
    _id: 'drafts.a',
    _type: 'article',
    _rev: 'revC',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someObjectArray: [
      {
        _key: 'a',
        _type: 'alpha',
        value: 'someString',
      },
    ],
  }

  expect.assertions(1)

  const value = await lastValueFrom(
    readDocumentDivergences({
      upstreamAtFork,
      upstreamHead,
      subjectHead,
      // All have up-to-date _rev and hash.
      resolutions: [
        {
          _key: 'someObjectArray[_key=="a"]',
          resolutionMarker: ['revB', await hashData(upstreamHead.someObjectArray[0])],
        },
      ],
    }).pipe(toSortedArray()),
  )

  expect(value).toMatchInlineSnapshot(`
    [
      [
        "someObjectArray[_key=="a"]",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "changeObjectType",
          "isAddressable": true,
          "path": "someObjectArray[_key=="a"]",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": {
              "parentArray": undefined,
              "parentObjectType": "alpha",
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObjectArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "a",
                  },
                  "type": "alpha",
                },
                {
                  "segment": {
                    "_key": "_type",
                  },
                  "type": "string",
                },
              ],
              "value": "alpha",
            },
            "upstreamAtFork": {
              "parentArray": undefined,
              "parentObjectType": "alpha",
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObjectArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "a",
                  },
                  "type": "alpha",
                },
                {
                  "segment": {
                    "_key": "_type",
                  },
                  "type": "string",
                },
              ],
              "value": "alpha",
            },
            "upstreamHead": {
              "parentArray": undefined,
              "parentObjectType": "beta",
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObjectArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "a",
                  },
                  "type": "beta",
                },
                {
                  "segment": {
                    "_key": "_type",
                  },
                  "type": "string",
                },
              ],
              "value": "beta",
            },
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
    ]
  `)
})

it('emits only a divergences on the object when upstream object type no longer matches matches subject object type', async () => {
  const upstreamAtFork: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revA',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someObjectArray: [
      {
        _key: 'a',
        _type: 'alpha',
        value: 'someString',
        someAlphaValue: 'a',
        someSharedValue: 'a',
      },
    ],
  }

  const upstreamHead: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revB',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someObjectArray: [
      {
        _key: 'a',
        _type: 'alpha',
        value: 'someString',
        someAlphaValue: 'b',
        someSharedValue: 'b',
      },
    ],
  }

  const subjectHead: SanityDocument = {
    _id: 'drafts.a',
    _type: 'article',
    _rev: 'revC',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someObjectArray: [
      {
        _key: 'a',
        someBetaValue: 'b',
        someSharedValue: 'b',
        _type: 'beta',
      },
    ],
  }

  expect.assertions(1)

  const value = await lastValueFrom(
    readDocumentDivergences({
      upstreamAtFork,
      upstreamHead,
      subjectHead,
    }).pipe(toSortedArray()),
  )

  expect(value).toMatchInlineSnapshot(`
    [
      [
        "someObjectArray[_key=="a"]",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "changeObjectType",
          "isAddressable": true,
          "path": "someObjectArray[_key=="a"]",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": undefined,
            "upstreamAtFork": {
              "parentArray": undefined,
              "parentObjectType": "alpha",
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObjectArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "a",
                  },
                  "type": "alpha",
                },
                {
                  "segment": {
                    "_key": "someAlphaValue",
                  },
                  "type": "string",
                },
              ],
              "value": "a",
            },
            "upstreamHead": {
              "parentArray": undefined,
              "parentObjectType": "alpha",
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObjectArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "a",
                  },
                  "type": "alpha",
                },
                {
                  "segment": {
                    "_key": "someAlphaValue",
                  },
                  "type": "string",
                },
              ],
              "value": "b",
            },
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
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

  const upstreamHead: SanityDocument = {
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

  const subjectHead: SanityDocument = {
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
    readDocumentDivergences({
      upstreamAtFork,
      upstreamHead,
      subjectHead,
      // All have up-to-date _rev and hash.
      resolutions: [
        {
          _key: 'someNonSystemField',
          resolutionMarker: ['revB', await hashData('c')],
        },
        {
          _key: 'somePrimitiveArray',
          resolutionMarker: ['revB', await hashData(['b', 'c', 'a'])],
        },
        {
          _key: 'somePrimitiveArray[0]',
          resolutionMarker: ['revB', await hashData('b')],
        },
        {
          _key: 'somePrimitiveArray[1]',
          resolutionMarker: ['revB', await hashData('c')],
        },
        {
          _key: 'somePrimitiveArray[2]',
          resolutionMarker: ['revB', await hashData('a')],
        },
        {
          _key: 'someObjectArray',
          resolutionMarker: [
            'revB',
            await hashData([
              {_key: 'a', value: 'a1'},
              {_key: 'b', value: 'b1'},
            ]),
          ],
        },
        {
          _key: 'someObjectArray[_key=="a"].value',
          resolutionMarker: ['revB', await hashData('a1')],
        },
        {
          _key: 'someObjectArray[_key=="b"].value',
          resolutionMarker: ['revB', await hashData('bu1')],
        },
      ],
    }).pipe(toSortedArray()),
  )

  expect(value).toMatchInlineSnapshot(`
    [
      [
        "someNonSystemField",
        {
          "documentId": "a",
          "documentType": "article",
          "isAddressable": false,
          "path": "someNonSystemField",
          "sinceRevisionId": "revB",
          "snapshots": {
            "subjectHead": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someNonSystemField",
                  },
                  "type": "string",
                },
              ],
              "value": "b",
            },
            "upstreamAtFork": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someNonSystemField",
                  },
                  "type": "string",
                },
              ],
              "value": "a",
            },
            "upstreamHead": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someNonSystemField",
                  },
                  "type": "string",
                },
              ],
              "value": "c",
            },
          },
          "status": "resolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "someObjectArray",
        {
          "documentId": "a",
          "documentType": "article",
          "isAddressable": false,
          "path": "someObjectArray",
          "sinceRevisionId": "revB",
          "snapshots": {
            "subjectHead": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObjectArray",
                  },
                  "type": "array",
                },
              ],
              "value": [
                {
                  "_key": "a",
                  "value": "a",
                },
                {
                  "_key": "b",
                  "value": "b",
                },
              ],
            },
            "upstreamAtFork": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObjectArray",
                  },
                  "type": "array",
                },
              ],
              "value": [
                {
                  "_key": "a",
                  "value": "a",
                },
                {
                  "_key": "b",
                  "value": "b",
                },
              ],
            },
            "upstreamHead": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObjectArray",
                  },
                  "type": "array",
                },
              ],
              "value": [
                {
                  "_key": "a",
                  "value": "a1",
                },
                {
                  "_key": "b",
                  "value": "b1",
                },
              ],
            },
          },
          "status": "resolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "someObjectArray[_key=="a"].value",
        {
          "documentId": "a",
          "documentType": "article",
          "isAddressable": false,
          "path": "someObjectArray[_key=="a"].value",
          "sinceRevisionId": "revB",
          "snapshots": {
            "subjectHead": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObjectArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "a",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "value",
                  },
                  "type": "string",
                },
              ],
              "value": "a",
            },
            "upstreamAtFork": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObjectArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "a",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "value",
                  },
                  "type": "string",
                },
              ],
              "value": "a",
            },
            "upstreamHead": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObjectArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "a",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "value",
                  },
                  "type": "string",
                },
              ],
              "value": "a1",
            },
          },
          "status": "resolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "someObjectArray[_key=="b"].value",
        {
          "documentId": "a",
          "documentType": "article",
          "isAddressable": false,
          "path": "someObjectArray[_key=="b"].value",
          "sinceRevisionId": "revB",
          "snapshots": {
            "subjectHead": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObjectArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "b",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "value",
                  },
                  "type": "string",
                },
              ],
              "value": "b",
            },
            "upstreamAtFork": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObjectArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "b",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "value",
                  },
                  "type": "string",
                },
              ],
              "value": "b",
            },
            "upstreamHead": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObjectArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "b",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "value",
                  },
                  "type": "string",
                },
              ],
              "value": "b1",
            },
          },
          "status": "resolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "somePrimitiveArray",
        {
          "documentId": "a",
          "documentType": "article",
          "isAddressable": false,
          "path": "somePrimitiveArray",
          "sinceRevisionId": "revB",
          "snapshots": {
            "subjectHead": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "somePrimitiveArray",
                  },
                  "type": "array",
                },
              ],
              "value": [
                "a",
                "b",
              ],
            },
            "upstreamAtFork": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "somePrimitiveArray",
                  },
                  "type": "array",
                },
              ],
              "value": [
                "a",
                "b",
              ],
            },
            "upstreamHead": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "somePrimitiveArray",
                  },
                  "type": "array",
                },
              ],
              "value": [
                "b",
                "c",
                "a",
              ],
            },
          },
          "status": "resolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "somePrimitiveArray[0]",
        {
          "documentId": "a",
          "documentType": "article",
          "isAddressable": false,
          "path": "somePrimitiveArray[0]",
          "sinceRevisionId": "revB",
          "snapshots": {
            "subjectHead": {
              "parentArray": [
                "a",
                "b",
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "somePrimitiveArray",
                  },
                  "type": "array",
                },
                {
                  "segment": 0,
                  "type": "string",
                },
              ],
              "value": "a",
            },
            "upstreamAtFork": {
              "parentArray": [
                "a",
                "b",
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "somePrimitiveArray",
                  },
                  "type": "array",
                },
                {
                  "segment": 0,
                  "type": "string",
                },
              ],
              "value": "a",
            },
            "upstreamHead": {
              "parentArray": [
                "b",
                "c",
                "a",
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "somePrimitiveArray",
                  },
                  "type": "array",
                },
                {
                  "segment": 0,
                  "type": "string",
                },
              ],
              "value": "b",
            },
          },
          "status": "resolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "somePrimitiveArray[1]",
        {
          "documentId": "a",
          "documentType": "article",
          "isAddressable": false,
          "path": "somePrimitiveArray[1]",
          "sinceRevisionId": "revB",
          "snapshots": {
            "subjectHead": {
              "parentArray": [
                "a",
                "b",
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "somePrimitiveArray",
                  },
                  "type": "array",
                },
                {
                  "segment": 1,
                  "type": "string",
                },
              ],
              "value": "b",
            },
            "upstreamAtFork": {
              "parentArray": [
                "a",
                "b",
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "somePrimitiveArray",
                  },
                  "type": "array",
                },
                {
                  "segment": 1,
                  "type": "string",
                },
              ],
              "value": "b",
            },
            "upstreamHead": {
              "parentArray": [
                "b",
                "c",
                "a",
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "somePrimitiveArray",
                  },
                  "type": "array",
                },
                {
                  "segment": 1,
                  "type": "string",
                },
              ],
              "value": "c",
            },
          },
          "status": "resolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "somePrimitiveArray[2]",
        {
          "documentId": "a",
          "documentType": "article",
          "isAddressable": false,
          "path": "somePrimitiveArray[2]",
          "sinceRevisionId": "revB",
          "snapshots": {
            "subjectHead": undefined,
            "upstreamAtFork": undefined,
            "upstreamHead": {
              "parentArray": [
                "b",
                "c",
                "a",
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "somePrimitiveArray",
                  },
                  "type": "array",
                },
                {
                  "segment": 2,
                  "type": "string",
                },
              ],
              "value": "a",
            },
          },
          "status": "resolved",
          "subjectId": "drafts.a",
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

  const upstreamHead: SanityDocument = {
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

  const subjectHead: SanityDocument = {
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
    readDocumentDivergences({
      upstreamAtFork,
      upstreamHead,
      subjectHead,
      resolutions: [
        // Stale _rev, up-to-date hash.
        {
          _key: 'someNonSystemField',
          resolutionMarker: ['revA', await hashData('c')],
        },
      ],
    }).pipe(toSortedArray()),
  )

  expect(value).toMatchInlineSnapshot(`
    [
      [
        "someNonSystemField",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "set",
          "isAddressable": true,
          "path": "someNonSystemField",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someNonSystemField",
                  },
                  "type": "string",
                },
              ],
              "value": "b",
            },
            "upstreamAtFork": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someNonSystemField",
                  },
                  "type": "string",
                },
              ],
              "value": "a",
            },
            "upstreamHead": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someNonSystemField",
                  },
                  "type": "string",
                },
              ],
              "value": "c",
            },
          },
          "status": "resolved",
          "subjectId": "drafts.a",
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

  const upstreamHead: SanityDocument = {
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

  const subjectHead: SanityDocument = {
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
    readDocumentDivergences({
      upstreamAtFork,
      upstreamHead,
      subjectHead,
      resolutions: [
        // Stale _rev and hash.
        {
          _key: 'someNonSystemField',
          resolutionMarker: ['revA', await hashData('a')],
        },
      ],
    }).pipe(toSortedArray()),
  )

  expect(value).toMatchInlineSnapshot(`
    [
      [
        "someNonSystemField",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "set",
          "isAddressable": true,
          "path": "someNonSystemField",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someNonSystemField",
                  },
                  "type": "string",
                },
              ],
              "value": "b",
            },
            "upstreamAtFork": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someNonSystemField",
                  },
                  "type": "string",
                },
              ],
              "value": "a",
            },
            "upstreamHead": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someNonSystemField",
                  },
                  "type": "string",
                },
              ],
              "value": "c",
            },
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
    ]
  `)
})

it('emits divergences that have stale resolutions but are implicitly resolved because they match the subject value', async () => {
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

  const upstreamHead: SanityDocument = {
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

  const subjectHead: SanityDocument = {
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
    readDocumentDivergences({
      upstreamAtFork,
      upstreamHead,
      subjectHead,
      resolutions: [
        // Stale _rev and hash.
        {
          _key: 'someNonSystemField',
          resolutionMarker: ['revA', await hashData('a')],
        },
      ],
    }).pipe(toSortedArray()),
  )

  expect(value).toMatchInlineSnapshot(`
    [
      [
        "someNonSystemField",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "set",
          "isAddressable": true,
          "path": "someNonSystemField",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someNonSystemField",
                  },
                  "type": "string",
                },
              ],
              "value": "c",
            },
            "upstreamAtFork": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someNonSystemField",
                  },
                  "type": "string",
                },
              ],
              "value": "a",
            },
            "upstreamHead": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someNonSystemField",
                  },
                  "type": "string",
                },
              ],
              "value": "c",
            },
          },
          "status": "resolved",
          "subjectId": "drafts.a",
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

  const upstreamHead: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revB',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    somePrimitiveArray: ['b', 'a'],
  }

  const subjectHead: SanityDocument = {
    _id: 'drafts.a',
    _type: 'article',
    _rev: 'revC',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    somePrimitiveArray: ['a', 'b'],
  }

  expect.assertions(1)

  const value = await lastValueFrom(
    readDocumentDivergences({
      upstreamAtFork,
      upstreamHead,
      subjectHead,
    }).pipe(toSortedArray()),
  )

  expect(value).toMatchInlineSnapshot(`
    [
      [
        "somePrimitiveArray[0]",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "set",
          "isAddressable": true,
          "path": "somePrimitiveArray[0]",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": {
              "parentArray": [
                "a",
                "b",
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "somePrimitiveArray",
                  },
                  "type": "array",
                },
                {
                  "segment": 0,
                  "type": "string",
                },
              ],
              "value": "a",
            },
            "upstreamAtFork": {
              "parentArray": [
                "a",
                "b",
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "somePrimitiveArray",
                  },
                  "type": "array",
                },
                {
                  "segment": 0,
                  "type": "string",
                },
              ],
              "value": "a",
            },
            "upstreamHead": {
              "parentArray": [
                "b",
                "a",
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "somePrimitiveArray",
                  },
                  "type": "array",
                },
                {
                  "segment": 0,
                  "type": "string",
                },
              ],
              "value": "b",
            },
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "somePrimitiveArray[1]",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "set",
          "isAddressable": true,
          "path": "somePrimitiveArray[1]",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": {
              "parentArray": [
                "a",
                "b",
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "somePrimitiveArray",
                  },
                  "type": "array",
                },
                {
                  "segment": 1,
                  "type": "string",
                },
              ],
              "value": "b",
            },
            "upstreamAtFork": {
              "parentArray": [
                "a",
                "b",
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "somePrimitiveArray",
                  },
                  "type": "array",
                },
                {
                  "segment": 1,
                  "type": "string",
                },
              ],
              "value": "b",
            },
            "upstreamHead": {
              "parentArray": [
                "b",
                "a",
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "somePrimitiveArray",
                  },
                  "type": "array",
                },
                {
                  "segment": 1,
                  "type": "string",
                },
              ],
              "value": "a",
            },
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
    ]
  `)
})

it('emits divergences when arrays of objects have been reordered', async () => {
  const upstreamAtFork: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revA',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someObjectArray: keyArray('a', 'b', 'c', 'd'),
  }

  const upstreamHead: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revB',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someObjectArray: keyArray('d', 'a', 'b', 'c'),
  }

  const subjectHead: SanityDocument = {
    _id: 'drafts.a',
    _type: 'article',
    _rev: 'revC',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someObjectArray: keyArray('a', 'b', 'c', 'd'),
  }

  expect.assertions(1)

  const value = await lastValueFrom(
    readDocumentDivergences({
      upstreamAtFork,
      upstreamHead,
      subjectHead,
    }).pipe(toSortedArray()),
  )

  expect(value).toMatchInlineSnapshot(`
    [
      [
        "someObjectArray[_key=="d"]",
        {
          "delta": -3,
          "documentId": "a",
          "documentType": "article",
          "effect": "move",
          "isAddressable": true,
          "path": "someObjectArray[_key=="d"]",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": {
              "parentArray": [
                {
                  "_key": "a",
                },
                {
                  "_key": "b",
                },
                {
                  "_key": "c",
                },
                {
                  "_key": "d",
                },
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObjectArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "d",
                  },
                  "type": "object",
                },
              ],
              "value": {
                "_key": "d",
              },
            },
            "upstreamAtFork": {
              "parentArray": [
                {
                  "_key": "a",
                },
                {
                  "_key": "b",
                },
                {
                  "_key": "c",
                },
                {
                  "_key": "d",
                },
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObjectArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "d",
                  },
                  "type": "object",
                },
              ],
              "value": {
                "_key": "d",
              },
            },
            "upstreamHead": {
              "parentArray": [
                {
                  "_key": "d",
                },
                {
                  "_key": "a",
                },
                {
                  "_key": "b",
                },
                {
                  "_key": "c",
                },
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObjectArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "d",
                  },
                  "type": "object",
                },
              ],
              "value": {
                "_key": "d",
              },
            },
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
          "upstreamPosition": 0,
        },
      ],
    ]
  `)
})

// Note that the process is currently inconsistent here, and does not emit resolved moves.
it('emits divergences when arrays of objects have been reordered but are implicitly resolved because they match the subject value', async () => {
  const upstreamAtFork: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revA',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someObjectArray: keyArray('a', 'b', 'c'),
  }

  const upstreamHead: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revB',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someObjectArray: keyArray('b', 'c', 'a'),
  }

  const subjectHead: SanityDocument = {
    _id: 'drafts.a',
    _type: 'article',
    _rev: 'revC',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someObjectArray: keyArray('b', 'c', 'a'),
  }

  expect.assertions(1)

  const value = await lastValueFrom(
    readDocumentDivergences({
      upstreamAtFork,
      upstreamHead,
      subjectHead,
    }).pipe(toSortedArray()),
  )

  expect(value).toMatchInlineSnapshot(`[]`)
})

// Note that the process is currently inconsistent here, and does not emit resolved moves.
it('emits resolved divergences when arrays of objects have been reordered', async () => {
  const upstreamAtFork: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revA',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someObjectArray: keyArray('a', 'b', 'c', 'd'),
  }

  const upstreamHead: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revB',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someObjectArray: keyArray('c', 'd', 'a', 'b'),
  }

  const subjectHead: SanityDocument = {
    _id: 'drafts.a',
    _type: 'article',
    _rev: 'revC',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someObjectArray: keyArray('a', 'b', 'c', 'd'),
  }

  expect.assertions(1)

  const value = await lastValueFrom(
    readDocumentDivergences({
      upstreamAtFork,
      upstreamHead,
      subjectHead,
      // Stale _rev, up-to-date signature.
      resolutions: [
        {
          _key: 'someObjectArray[_key=="c"]',
          // resolutionMarker: ['revA', ['c', 'd', 'a', 'b']],
          resolutionMarker: ['revA', 0],
        },
        {
          _key: 'someObjectArray[_key=="d"]',
          // resolutionMarker: ['revA', ['c', 'd', 'a', 'b']],
          resolutionMarker: ['revA', 1],
        },
      ],
    }).pipe(toSortedArray()),
  )

  expect(value).toMatchInlineSnapshot(`[]`)
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

  const upstreamHead: SanityDocument = {
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

  const subjectHead: SanityDocument = {
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
    readDocumentDivergences({
      upstreamAtFork,
      upstreamHead,
      subjectHead,
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

  const upstreamHead: SanityDocument = {
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

  const subjectHead: SanityDocument = {
    _id: 'drafts.a',
    _type: 'article',
    _rev: 'revC',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
  }

  expect.assertions(1)

  const value = await lastValueFrom(
    readDocumentDivergences({
      upstreamAtFork,
      upstreamHead,
      subjectHead,
    }).pipe(toSortedArray()),
  )

  expect(value).toMatchInlineSnapshot(`
    [
      [
        "someObject",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "set",
          "isAddressable": false,
          "path": "someObject",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": undefined,
            "upstreamAtFork": undefined,
            "upstreamHead": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObject",
                  },
                  "type": "object",
                },
              ],
              "value": {
                "b": "b",
                "c": "d",
                "e": {
                  "f": "g",
                },
              },
            },
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "someObject.b",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "set",
          "isAddressable": true,
          "path": "someObject.b",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": undefined,
            "upstreamAtFork": undefined,
            "upstreamHead": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObject",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "b",
                  },
                  "type": "string",
                },
              ],
              "value": "b",
            },
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "someObject.c",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "set",
          "isAddressable": true,
          "path": "someObject.c",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": undefined,
            "upstreamAtFork": undefined,
            "upstreamHead": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObject",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "c",
                  },
                  "type": "string",
                },
              ],
              "value": "d",
            },
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "someObject.e",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "set",
          "isAddressable": false,
          "path": "someObject.e",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": undefined,
            "upstreamAtFork": undefined,
            "upstreamHead": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObject",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "e",
                  },
                  "type": "object",
                },
              ],
              "value": {
                "f": "g",
              },
            },
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "someObject.e.f",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "set",
          "isAddressable": true,
          "path": "someObject.e.f",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": undefined,
            "upstreamAtFork": undefined,
            "upstreamHead": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObject",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "e",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "f",
                  },
                  "type": "string",
                },
              ],
              "value": "g",
            },
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
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

  const upstreamHead: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revB',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
  }

  const subjectHead: SanityDocument = {
    _id: 'drafts.a',
    _type: 'article',
    _rev: 'revC',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someObject: {
      b: 'b',
      e: {
        f: 'g',
      },
    },
  }

  expect.assertions(1)

  const value = await lastValueFrom(
    readDocumentDivergences({
      upstreamAtFork,
      upstreamHead,
      subjectHead,
    }).pipe(toSortedArray()),
  )

  expect(value).toMatchInlineSnapshot(`
    [
      [
        "someObject",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "unset",
          "isAddressable": false,
          "path": "someObject",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObject",
                  },
                  "type": "object",
                },
              ],
              "value": {
                "b": "b",
                "e": {
                  "f": "g",
                },
              },
            },
            "upstreamAtFork": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObject",
                  },
                  "type": "object",
                },
              ],
              "value": {
                "b": "b",
                "c": "d",
                "e": {
                  "f": "g",
                },
              },
            },
            "upstreamHead": undefined,
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "someObject.b",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "unset",
          "isAddressable": true,
          "path": "someObject.b",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObject",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "b",
                  },
                  "type": "string",
                },
              ],
              "value": "b",
            },
            "upstreamAtFork": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObject",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "b",
                  },
                  "type": "string",
                },
              ],
              "value": "b",
            },
            "upstreamHead": undefined,
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "someObject.c",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "unset",
          "isAddressable": true,
          "path": "someObject.c",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": undefined,
            "upstreamAtFork": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObject",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "c",
                  },
                  "type": "string",
                },
              ],
              "value": "d",
            },
            "upstreamHead": undefined,
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "someObject.e",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "unset",
          "isAddressable": false,
          "path": "someObject.e",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObject",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "e",
                  },
                  "type": "object",
                },
              ],
              "value": {
                "f": "g",
              },
            },
            "upstreamAtFork": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObject",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "e",
                  },
                  "type": "object",
                },
              ],
              "value": {
                "f": "g",
              },
            },
            "upstreamHead": undefined,
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "someObject.e.f",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "unset",
          "isAddressable": true,
          "path": "someObject.e.f",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObject",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "e",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "f",
                  },
                  "type": "string",
                },
              ],
              "value": "g",
            },
            "upstreamAtFork": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObject",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "e",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "f",
                  },
                  "type": "string",
                },
              ],
              "value": "g",
            },
            "upstreamHead": undefined,
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
    ]
  `)
})

it('emits divergences for fields in nullified objects', async () => {
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

  const upstreamHead: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revB',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someObject: null,
  }

  const subjectHead: SanityDocument = {
    _id: 'drafts.a',
    _type: 'article',
    _rev: 'revC',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someObject: {
      b: 'b',
      e: {
        f: 'g',
      },
    },
  }

  expect.assertions(1)

  const value = await lastValueFrom(
    readDocumentDivergences({
      upstreamAtFork,
      upstreamHead,
      subjectHead,
    }).pipe(toSortedArray()),
  )

  expect(value).toMatchInlineSnapshot(`
    [
      [
        "someObject",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "set",
          "isAddressable": false,
          "path": "someObject",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObject",
                  },
                  "type": "object",
                },
              ],
              "value": {
                "b": "b",
                "e": {
                  "f": "g",
                },
              },
            },
            "upstreamAtFork": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObject",
                  },
                  "type": "object",
                },
              ],
              "value": {
                "b": "b",
                "c": "d",
                "e": {
                  "f": "g",
                },
              },
            },
            "upstreamHead": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObject",
                  },
                  "type": "object",
                },
              ],
              "value": null,
            },
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "someObject.b",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "unset",
          "isAddressable": true,
          "path": "someObject.b",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObject",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "b",
                  },
                  "type": "string",
                },
              ],
              "value": "b",
            },
            "upstreamAtFork": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObject",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "b",
                  },
                  "type": "string",
                },
              ],
              "value": "b",
            },
            "upstreamHead": undefined,
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "someObject.c",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "unset",
          "isAddressable": true,
          "path": "someObject.c",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": undefined,
            "upstreamAtFork": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObject",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "c",
                  },
                  "type": "string",
                },
              ],
              "value": "d",
            },
            "upstreamHead": undefined,
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "someObject.e",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "unset",
          "isAddressable": false,
          "path": "someObject.e",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObject",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "e",
                  },
                  "type": "object",
                },
              ],
              "value": {
                "f": "g",
              },
            },
            "upstreamAtFork": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObject",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "e",
                  },
                  "type": "object",
                },
              ],
              "value": {
                "f": "g",
              },
            },
            "upstreamHead": undefined,
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "someObject.e.f",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "unset",
          "isAddressable": true,
          "path": "someObject.e.f",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObject",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "e",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "f",
                  },
                  "type": "string",
                },
              ],
              "value": "g",
            },
            "upstreamAtFork": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someObject",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "e",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "f",
                  },
                  "type": "string",
                },
              ],
              "value": "g",
            },
            "upstreamHead": undefined,
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
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

  const upstreamHead: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revB',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someArray: ['a', 'b', 'c'],
  }

  const subjectHead: SanityDocument = {
    _id: 'drafts.a',
    _type: 'article',
    _rev: 'revC',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
  }

  expect.assertions(1)

  const value = await lastValueFrom(
    readDocumentDivergences({
      upstreamAtFork,
      upstreamHead,
      subjectHead,
    }).pipe(toSortedArray()),
  )

  expect(value).toMatchInlineSnapshot(`
    [
      [
        "someArray[0]",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "insert",
          "isAddressable": true,
          "path": "someArray[0]",
          "position": -1,
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": undefined,
            "upstreamAtFork": undefined,
            "upstreamHead": {
              "parentArray": [
                "a",
                "b",
                "c",
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": 0,
                  "type": "string",
                },
              ],
              "value": "a",
            },
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "someArray[1]",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "insert",
          "isAddressable": true,
          "path": "someArray[1]",
          "position": -1,
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": undefined,
            "upstreamAtFork": undefined,
            "upstreamHead": {
              "parentArray": [
                "a",
                "b",
                "c",
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": 1,
                  "type": "string",
                },
              ],
              "value": "b",
            },
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "someArray[2]",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "insert",
          "isAddressable": true,
          "path": "someArray[2]",
          "position": -1,
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": undefined,
            "upstreamAtFork": undefined,
            "upstreamHead": {
              "parentArray": [
                "a",
                "b",
                "c",
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": 2,
                  "type": "string",
                },
              ],
              "value": "c",
            },
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
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

  const upstreamHead: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revB',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
  }

  const subjectHead: SanityDocument = {
    _id: 'drafts.a',
    _type: 'article',
    _rev: 'revC',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someArray: ['a', 'b'],
  }

  expect.assertions(1)

  const value = await lastValueFrom(
    readDocumentDivergences({
      upstreamAtFork,
      upstreamHead,
      subjectHead,
    }).pipe(toSortedArray()),
  )

  expect(value).toMatchInlineSnapshot(`
    [
      [
        "someArray[0]",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "unset",
          "isAddressable": true,
          "path": "someArray[0]",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": {
              "parentArray": [
                "a",
                "b",
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": 0,
                  "type": "string",
                },
              ],
              "value": "a",
            },
            "upstreamAtFork": {
              "parentArray": [
                "a",
                "b",
                "c",
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": 0,
                  "type": "string",
                },
              ],
              "value": "a",
            },
            "upstreamHead": undefined,
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "someArray[1]",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "unset",
          "isAddressable": true,
          "path": "someArray[1]",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": {
              "parentArray": [
                "a",
                "b",
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": 1,
                  "type": "string",
                },
              ],
              "value": "b",
            },
            "upstreamAtFork": {
              "parentArray": [
                "a",
                "b",
                "c",
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": 1,
                  "type": "string",
                },
              ],
              "value": "b",
            },
            "upstreamHead": undefined,
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "someArray[2]",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "unset",
          "isAddressable": true,
          "path": "someArray[2]",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": undefined,
            "upstreamAtFork": {
              "parentArray": [
                "a",
                "b",
                "c",
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": 2,
                  "type": "string",
                },
              ],
              "value": "c",
            },
            "upstreamHead": undefined,
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
    ]
  `)
})

it('emits divergences for items added to primitive arrays', async () => {
  const upstreamAtFork: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revA',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someArray: ['a', 'b', 'c'],
  }

  const upstreamHead: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revB',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someArray: ['a', 'b', 'c', 'd'],
  }

  const subjectHead: SanityDocument = {
    _id: 'drafts.a',
    _type: 'article',
    _rev: 'revC',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
  }

  expect.assertions(1)

  const value = await lastValueFrom(
    readDocumentDivergences({
      upstreamAtFork,
      upstreamHead,
      subjectHead,
    }).pipe(toSortedArray()),
  )

  // TODO: Create containing array.
  expect(value).toMatchInlineSnapshot(`
    [
      [
        "someArray[3]",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "insert",
          "isAddressable": true,
          "path": "someArray[3]",
          "position": -1,
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": undefined,
            "upstreamAtFork": undefined,
            "upstreamHead": {
              "parentArray": [
                "a",
                "b",
                "c",
                "d",
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": 3,
                  "type": "string",
                },
              ],
              "value": "d",
            },
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
    ]
  `)
})

it('emits divergences for items added to primitive arrays since resolution', async () => {
  const upstreamAtFork: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revA',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someArray: ['a', 'b', 'c'],
  }

  const upstreamHead: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revB',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someArray: ['a', 'b', 'c', 'd'],
  }

  const subjectHead: SanityDocument = {
    _id: 'drafts.a',
    _type: 'article',
    _rev: 'revC',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
  }

  expect.assertions(1)

  const value = await lastValueFrom(
    readDocumentDivergences({
      upstreamAtFork,
      upstreamHead,
      subjectHead,
      resolutions: [
        // Stale _rev.
        {
          _key: 'someArray[3]',
          resolutionMarker: ['revA', await hashData('d')],
        },
      ],
    }).pipe(toSortedArray()),
  )

  // TODO: Create containing array.
  expect(value).toMatchInlineSnapshot(`
    [
      [
        "someArray[3]",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "set",
          "isAddressable": true,
          "path": "someArray[3]",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": undefined,
            "upstreamAtFork": undefined,
            "upstreamHead": {
              "parentArray": [
                "a",
                "b",
                "c",
                "d",
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": 3,
                  "type": "string",
                },
              ],
              "value": "d",
            },
          },
          "status": "resolved",
          "subjectId": "drafts.a",
        },
      ],
    ]
  `)
})

it('emits divergences for items removed from primitive arrays', async () => {
  const upstreamAtFork: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revA',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someArray: ['a', 'b', 'c'],
  }

  const upstreamHead: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revB',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someArray: ['a', 'b'],
  }

  const subjectHead: SanityDocument = {
    _id: 'drafts.a',
    _type: 'article',
    _rev: 'revC',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someArray: ['a', 'b'],
  }

  expect.assertions(1)

  const value = await lastValueFrom(
    readDocumentDivergences({
      upstreamAtFork,
      upstreamHead,
      subjectHead,
    }).pipe(toSortedArray()),
  )

  expect(value).toMatchInlineSnapshot(`
    [
      [
        "someArray[2]",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "unset",
          "isAddressable": true,
          "path": "someArray[2]",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": undefined,
            "upstreamAtFork": {
              "parentArray": [
                "a",
                "b",
                "c",
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": 2,
                  "type": "string",
                },
              ],
              "value": "c",
            },
            "upstreamHead": undefined,
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
    ]
  `)
})

it('emits divergences for items removed from primitive arrays since resolution', async () => {
  const upstreamAtFork: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revA',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someArray: ['a', 'b', 'c'],
  }

  const upstreamHead: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revB',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someArray: ['a', 'b'],
  }

  const subjectHead: SanityDocument = {
    _id: 'drafts.a',
    _type: 'article',
    _rev: 'revC',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
  }

  expect.assertions(1)

  const value = await lastValueFrom(
    readDocumentDivergences({
      upstreamAtFork,
      upstreamHead,
      subjectHead,
      resolutions: [
        // Stale _rev.
        {
          _key: 'someArray[3]',
          resolutionMarker: ['revA', await hashData('c')],
        },
      ],
    }).pipe(toSortedArray()),
  )

  expect(value).toMatchInlineSnapshot(`
    [
      [
        "someArray[2]",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "unset",
          "isAddressable": true,
          "path": "someArray[2]",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": undefined,
            "upstreamAtFork": {
              "parentArray": [
                "a",
                "b",
                "c",
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": 2,
                  "type": "string",
                },
              ],
              "value": "c",
            },
            "upstreamHead": undefined,
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
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

  const upstreamHead: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revB',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someArray: null,
  }

  const subjectHead: SanityDocument = {
    _id: 'drafts.a',
    _type: 'article',
    _rev: 'revC',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someArray: ['a', 'b'],
  }

  expect.assertions(1)

  const value = await lastValueFrom(
    readDocumentDivergences({
      upstreamAtFork,
      upstreamHead,
      subjectHead,
    }).pipe(toSortedArray()),
  )

  expect(value).toMatchInlineSnapshot(`
    [
      [
        "someArray[0]",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "unset",
          "isAddressable": true,
          "path": "someArray[0]",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": {
              "parentArray": [
                "a",
                "b",
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": 0,
                  "type": "string",
                },
              ],
              "value": "a",
            },
            "upstreamAtFork": {
              "parentArray": [
                "a",
                "b",
                "c",
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": 0,
                  "type": "string",
                },
              ],
              "value": "a",
            },
            "upstreamHead": undefined,
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "someArray[1]",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "unset",
          "isAddressable": true,
          "path": "someArray[1]",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": {
              "parentArray": [
                "a",
                "b",
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": 1,
                  "type": "string",
                },
              ],
              "value": "b",
            },
            "upstreamAtFork": {
              "parentArray": [
                "a",
                "b",
                "c",
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": 1,
                  "type": "string",
                },
              ],
              "value": "b",
            },
            "upstreamHead": undefined,
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "someArray[2]",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "unset",
          "isAddressable": true,
          "path": "someArray[2]",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": undefined,
            "upstreamAtFork": {
              "parentArray": [
                "a",
                "b",
                "c",
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": 2,
                  "type": "string",
                },
              ],
              "value": "c",
            },
            "upstreamHead": undefined,
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
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

  const upstreamHead: SanityDocument = {
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

  const subjectHead: SanityDocument = {
    _id: 'drafts.a',
    _type: 'article',
    _rev: 'revC',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
  }

  expect.assertions(1)

  const value = await lastValueFrom(
    readDocumentDivergences({
      upstreamAtFork,
      upstreamHead,
      subjectHead,
    }).pipe(toSortedArray()),
  )

  expect(value).toMatchInlineSnapshot(`
    [
      [
        "someArray[_key=="a"]",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "insert",
          "isAddressable": true,
          "path": "someArray[_key=="a"]",
          "position": 0,
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": undefined,
            "upstreamAtFork": undefined,
            "upstreamHead": {
              "parentArray": [
                {
                  "_key": "a",
                  "value": "a1",
                },
                {
                  "_key": "b",
                  "value": "b1",
                },
                {
                  "_key": "c",
                  "value": "c1",
                },
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "a",
                  },
                  "type": "object",
                },
              ],
              "value": {
                "_key": "a",
                "value": "a1",
              },
            },
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "someArray[_key=="a"].value",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "set",
          "isAddressable": true,
          "path": "someArray[_key=="a"].value",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": undefined,
            "upstreamAtFork": undefined,
            "upstreamHead": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "a",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "value",
                  },
                  "type": "string",
                },
              ],
              "value": "a1",
            },
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "someArray[_key=="b"]",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "insert",
          "isAddressable": true,
          "path": "someArray[_key=="b"]",
          "position": 1,
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": undefined,
            "upstreamAtFork": undefined,
            "upstreamHead": {
              "parentArray": [
                {
                  "_key": "a",
                  "value": "a1",
                },
                {
                  "_key": "b",
                  "value": "b1",
                },
                {
                  "_key": "c",
                  "value": "c1",
                },
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "b",
                  },
                  "type": "object",
                },
              ],
              "value": {
                "_key": "b",
                "value": "b1",
              },
            },
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "someArray[_key=="b"].value",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "set",
          "isAddressable": true,
          "path": "someArray[_key=="b"].value",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": undefined,
            "upstreamAtFork": undefined,
            "upstreamHead": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "b",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "value",
                  },
                  "type": "string",
                },
              ],
              "value": "b1",
            },
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "someArray[_key=="c"]",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "insert",
          "isAddressable": true,
          "path": "someArray[_key=="c"]",
          "position": 2,
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": undefined,
            "upstreamAtFork": undefined,
            "upstreamHead": {
              "parentArray": [
                {
                  "_key": "a",
                  "value": "a1",
                },
                {
                  "_key": "b",
                  "value": "b1",
                },
                {
                  "_key": "c",
                  "value": "c1",
                },
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "c",
                  },
                  "type": "object",
                },
              ],
              "value": {
                "_key": "c",
                "value": "c1",
              },
            },
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "someArray[_key=="c"].value",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "set",
          "isAddressable": true,
          "path": "someArray[_key=="c"].value",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": undefined,
            "upstreamAtFork": undefined,
            "upstreamHead": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "c",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "value",
                  },
                  "type": "string",
                },
              ],
              "value": "c1",
            },
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
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

  const upstreamHead: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revB',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
  }

  const subjectHead: SanityDocument = {
    _id: 'drafts.a',
    _type: 'article',
    _rev: 'revC',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someArray: [
      {_key: 'a', value: 'a1'},
      {_key: 'b', value: 'b1'},
    ],
  }

  expect.assertions(1)

  const value = await lastValueFrom(
    readDocumentDivergences({
      upstreamAtFork,
      upstreamHead,
      subjectHead,
    }).pipe(toSortedArray()),
  )

  expect(value).toMatchInlineSnapshot(`
    [
      [
        "someArray[_key=="a"]",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "unset",
          "isAddressable": true,
          "path": "someArray[_key=="a"]",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": {
              "parentArray": [
                {
                  "_key": "a",
                  "value": "a1",
                },
                {
                  "_key": "b",
                  "value": "b1",
                },
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "a",
                  },
                  "type": "object",
                },
              ],
              "value": {
                "_key": "a",
                "value": "a1",
              },
            },
            "upstreamAtFork": {
              "parentArray": [
                {
                  "_key": "a",
                  "value": "a1",
                },
                {
                  "_key": "b",
                  "value": "b1",
                },
                {
                  "_key": "c",
                  "value": "c1",
                },
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "a",
                  },
                  "type": "object",
                },
              ],
              "value": {
                "_key": "a",
                "value": "a1",
              },
            },
            "upstreamHead": undefined,
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "someArray[_key=="a"].value",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "unset",
          "isAddressable": true,
          "path": "someArray[_key=="a"].value",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "a",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "value",
                  },
                  "type": "string",
                },
              ],
              "value": "a1",
            },
            "upstreamAtFork": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "a",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "value",
                  },
                  "type": "string",
                },
              ],
              "value": "a1",
            },
            "upstreamHead": undefined,
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "someArray[_key=="b"]",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "unset",
          "isAddressable": true,
          "path": "someArray[_key=="b"]",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": {
              "parentArray": [
                {
                  "_key": "a",
                  "value": "a1",
                },
                {
                  "_key": "b",
                  "value": "b1",
                },
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "b",
                  },
                  "type": "object",
                },
              ],
              "value": {
                "_key": "b",
                "value": "b1",
              },
            },
            "upstreamAtFork": {
              "parentArray": [
                {
                  "_key": "a",
                  "value": "a1",
                },
                {
                  "_key": "b",
                  "value": "b1",
                },
                {
                  "_key": "c",
                  "value": "c1",
                },
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "b",
                  },
                  "type": "object",
                },
              ],
              "value": {
                "_key": "b",
                "value": "b1",
              },
            },
            "upstreamHead": undefined,
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "someArray[_key=="b"].value",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "unset",
          "isAddressable": true,
          "path": "someArray[_key=="b"].value",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "b",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "value",
                  },
                  "type": "string",
                },
              ],
              "value": "b1",
            },
            "upstreamAtFork": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "b",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "value",
                  },
                  "type": "string",
                },
              ],
              "value": "b1",
            },
            "upstreamHead": undefined,
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "someArray[_key=="c"]",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "unset",
          "isAddressable": true,
          "path": "someArray[_key=="c"]",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": undefined,
            "upstreamAtFork": {
              "parentArray": [
                {
                  "_key": "a",
                  "value": "a1",
                },
                {
                  "_key": "b",
                  "value": "b1",
                },
                {
                  "_key": "c",
                  "value": "c1",
                },
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "c",
                  },
                  "type": "object",
                },
              ],
              "value": {
                "_key": "c",
                "value": "c1",
              },
            },
            "upstreamHead": undefined,
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "someArray[_key=="c"].value",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "unset",
          "isAddressable": true,
          "path": "someArray[_key=="c"].value",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": undefined,
            "upstreamAtFork": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "c",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "value",
                  },
                  "type": "string",
                },
              ],
              "value": "c1",
            },
            "upstreamHead": undefined,
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
    ]
  `)
})

it('emits divergences for items added to object arrays', async () => {
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

  const upstreamHead: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revB',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someArray: [
      {_key: 'a', value: 'a1'},
      {_key: 'b', value: 'b1'},
      {_key: 'c', value: 'c1'},
      {_key: 'd', value: 'd1'},
    ],
  }

  const subjectHead: SanityDocument = {
    _id: 'drafts.a',
    _type: 'article',
    _rev: 'revC',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
  }

  expect.assertions(1)

  const value = await lastValueFrom(
    readDocumentDivergences({
      upstreamAtFork,
      upstreamHead,
      subjectHead,
    }).pipe(toSortedArray()),
  )

  // TODO: Create containing array.
  expect(value).toMatchInlineSnapshot(`
    [
      [
        "someArray[_key=="d"]",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "insert",
          "isAddressable": true,
          "path": "someArray[_key=="d"]",
          "position": 3,
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": undefined,
            "upstreamAtFork": undefined,
            "upstreamHead": {
              "parentArray": [
                {
                  "_key": "a",
                  "value": "a1",
                },
                {
                  "_key": "b",
                  "value": "b1",
                },
                {
                  "_key": "c",
                  "value": "c1",
                },
                {
                  "_key": "d",
                  "value": "d1",
                },
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "d",
                  },
                  "type": "object",
                },
              ],
              "value": {
                "_key": "d",
                "value": "d1",
              },
            },
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "someArray[_key=="d"].value",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "set",
          "isAddressable": true,
          "path": "someArray[_key=="d"].value",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": undefined,
            "upstreamAtFork": undefined,
            "upstreamHead": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "d",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "value",
                  },
                  "type": "string",
                },
              ],
              "value": "d1",
            },
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
    ]
  `)
})

it('emits divergences for items added to object arrays since resolution', async () => {
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

  const upstreamHead: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revB',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someArray: [
      {_key: 'a', value: 'a1'},
      {_key: 'b', value: 'b1'},
      {_key: 'c', value: 'c1'},
      {_key: 'd', value: 'd1'},
    ],
  }

  const subjectHead: SanityDocument = {
    _id: 'drafts.a',
    _type: 'article',
    _rev: 'revC',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
  }

  expect.assertions(1)

  const value = await lastValueFrom(
    readDocumentDivergences({
      upstreamAtFork,
      upstreamHead,
      subjectHead,
      resolutions: [
        // Stale _rev and hash.
        {
          _key: 'someArray[_key=="d"].value',
          resolutionMarker: ['revA', await hashData('d')],
        },
      ],
    }).pipe(toSortedArray()),
  )

  expect(value).toMatchInlineSnapshot(`
    [
      [
        "someArray[_key=="d"]",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "insert",
          "isAddressable": true,
          "path": "someArray[_key=="d"]",
          "position": 3,
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": undefined,
            "upstreamAtFork": undefined,
            "upstreamHead": {
              "parentArray": [
                {
                  "_key": "a",
                  "value": "a1",
                },
                {
                  "_key": "b",
                  "value": "b1",
                },
                {
                  "_key": "c",
                  "value": "c1",
                },
                {
                  "_key": "d",
                  "value": "d1",
                },
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "d",
                  },
                  "type": "object",
                },
              ],
              "value": {
                "_key": "d",
                "value": "d1",
              },
            },
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "someArray[_key=="d"].value",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "set",
          "isAddressable": true,
          "path": "someArray[_key=="d"].value",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": undefined,
            "upstreamAtFork": undefined,
            "upstreamHead": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "d",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "value",
                  },
                  "type": "string",
                },
              ],
              "value": "d1",
            },
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
    ]
  `)
})

it('emits divergences for items removed from object arrays', async () => {
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

  const upstreamHead: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revB',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someArray: [
      {_key: 'a', value: 'a1'},
      {_key: 'b', value: 'b1'},
    ],
  }

  const subjectHead: SanityDocument = {
    _id: 'drafts.a',
    _type: 'article',
    _rev: 'revC',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
  }

  expect.assertions(1)

  const value = await lastValueFrom(
    readDocumentDivergences({
      upstreamAtFork,
      upstreamHead,
      subjectHead,
    }).pipe(toSortedArray()),
  )

  // Note: the `unset` divergence on the object itself is not strictly necessary (unlike when setting a nested value).
  expect(value).toMatchInlineSnapshot(`
    [
      [
        "someArray[_key=="c"]",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "unset",
          "isAddressable": true,
          "path": "someArray[_key=="c"]",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": undefined,
            "upstreamAtFork": {
              "parentArray": [
                {
                  "_key": "a",
                  "value": "a1",
                },
                {
                  "_key": "b",
                  "value": "b1",
                },
                {
                  "_key": "c",
                  "value": "c1",
                },
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "c",
                  },
                  "type": "object",
                },
              ],
              "value": {
                "_key": "c",
                "value": "c1",
              },
            },
            "upstreamHead": undefined,
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "someArray[_key=="c"].value",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "unset",
          "isAddressable": true,
          "path": "someArray[_key=="c"].value",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": undefined,
            "upstreamAtFork": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "c",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "value",
                  },
                  "type": "string",
                },
              ],
              "value": "c1",
            },
            "upstreamHead": undefined,
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
    ]
  `)
})

it('emits divergences for items removed from object arrays since resolution', async () => {
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

  const upstreamHead: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revB',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someArray: [
      {_key: 'a', value: 'a1'},
      {_key: 'b', value: 'b1'},
    ],
  }

  const subjectHead: SanityDocument = {
    _id: 'drafts.a',
    _type: 'article',
    _rev: 'revC',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
  }

  expect.assertions(1)

  const value = await lastValueFrom(
    readDocumentDivergences({
      upstreamAtFork,
      upstreamHead,
      subjectHead,
      resolutions: [
        // Stale _rev and hash.
        {
          _key: 'someArray[_key=="c"].value',
          resolutionMarker: ['revA', await hashData('d')],
        },
      ],
    }).pipe(toSortedArray()),
  )

  expect(value).toMatchInlineSnapshot(`
    [
      [
        "someArray[_key=="c"]",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "unset",
          "isAddressable": true,
          "path": "someArray[_key=="c"]",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": undefined,
            "upstreamAtFork": {
              "parentArray": [
                {
                  "_key": "a",
                  "value": "a1",
                },
                {
                  "_key": "b",
                  "value": "b1",
                },
                {
                  "_key": "c",
                  "value": "c1",
                },
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "c",
                  },
                  "type": "object",
                },
              ],
              "value": {
                "_key": "c",
                "value": "c1",
              },
            },
            "upstreamHead": undefined,
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "someArray[_key=="c"].value",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "unset",
          "isAddressable": true,
          "path": "someArray[_key=="c"].value",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": undefined,
            "upstreamAtFork": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "c",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "value",
                  },
                  "type": "string",
                },
              ],
              "value": "c1",
            },
            "upstreamHead": undefined,
          },
          "status": "resolved",
          "subjectId": "drafts.a",
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

  const upstreamHead: SanityDocument = {
    _id: 'a',
    _type: 'article',
    _rev: 'revB',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someArray: null,
  }

  const subjectHead: SanityDocument = {
    _id: 'drafts.a',
    _type: 'article',
    _rev: 'revC',
    _createdAt: '2025-10-29T09:00:00Z',
    _updatedAt: '2025-10-29T09:10:00Z',
    someArray: [
      {_key: 'a', value: 'a1'},
      {_key: 'b', value: 'b1'},
    ],
  }

  expect.assertions(1)

  const value = await lastValueFrom(
    readDocumentDivergences({
      upstreamAtFork,
      upstreamHead,
      subjectHead,
    }).pipe(toSortedArray()),
  )

  // TODO: The `unset` of `"someArray[_key=="a"]"` should not be addressable.
  expect(value).toMatchInlineSnapshot(`
    [
      [
        "someArray[_key=="a"]",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "unset",
          "isAddressable": true,
          "path": "someArray[_key=="a"]",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": {
              "parentArray": [
                {
                  "_key": "a",
                  "value": "a1",
                },
                {
                  "_key": "b",
                  "value": "b1",
                },
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "a",
                  },
                  "type": "object",
                },
              ],
              "value": {
                "_key": "a",
                "value": "a1",
              },
            },
            "upstreamAtFork": {
              "parentArray": [
                {
                  "_key": "a",
                  "value": "a1",
                },
                {
                  "_key": "b",
                  "value": "b1",
                },
                {
                  "_key": "c",
                  "value": "c1",
                },
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "a",
                  },
                  "type": "object",
                },
              ],
              "value": {
                "_key": "a",
                "value": "a1",
              },
            },
            "upstreamHead": undefined,
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "someArray[_key=="a"].value",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "unset",
          "isAddressable": true,
          "path": "someArray[_key=="a"].value",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "a",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "value",
                  },
                  "type": "string",
                },
              ],
              "value": "a1",
            },
            "upstreamAtFork": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "a",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "value",
                  },
                  "type": "string",
                },
              ],
              "value": "a1",
            },
            "upstreamHead": undefined,
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "someArray[_key=="b"]",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "unset",
          "isAddressable": true,
          "path": "someArray[_key=="b"]",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": {
              "parentArray": [
                {
                  "_key": "a",
                  "value": "a1",
                },
                {
                  "_key": "b",
                  "value": "b1",
                },
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "b",
                  },
                  "type": "object",
                },
              ],
              "value": {
                "_key": "b",
                "value": "b1",
              },
            },
            "upstreamAtFork": {
              "parentArray": [
                {
                  "_key": "a",
                  "value": "a1",
                },
                {
                  "_key": "b",
                  "value": "b1",
                },
                {
                  "_key": "c",
                  "value": "c1",
                },
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "b",
                  },
                  "type": "object",
                },
              ],
              "value": {
                "_key": "b",
                "value": "b1",
              },
            },
            "upstreamHead": undefined,
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "someArray[_key=="b"].value",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "unset",
          "isAddressable": true,
          "path": "someArray[_key=="b"].value",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "b",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "value",
                  },
                  "type": "string",
                },
              ],
              "value": "b1",
            },
            "upstreamAtFork": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "b",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "value",
                  },
                  "type": "string",
                },
              ],
              "value": "b1",
            },
            "upstreamHead": undefined,
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "someArray[_key=="c"]",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "unset",
          "isAddressable": true,
          "path": "someArray[_key=="c"]",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": undefined,
            "upstreamAtFork": {
              "parentArray": [
                {
                  "_key": "a",
                  "value": "a1",
                },
                {
                  "_key": "b",
                  "value": "b1",
                },
                {
                  "_key": "c",
                  "value": "c1",
                },
              ],
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "c",
                  },
                  "type": "object",
                },
              ],
              "value": {
                "_key": "c",
                "value": "c1",
              },
            },
            "upstreamHead": undefined,
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
      [
        "someArray[_key=="c"].value",
        {
          "documentId": "a",
          "documentType": "article",
          "effect": "unset",
          "isAddressable": true,
          "path": "someArray[_key=="c"].value",
          "sinceRevisionId": "revA",
          "snapshots": {
            "subjectHead": undefined,
            "upstreamAtFork": {
              "parentArray": undefined,
              "parentObjectType": undefined,
              "pathWithTypes": [
                {
                  "segment": {
                    "_key": "someArray",
                  },
                  "type": "array",
                },
                {
                  "segment": {
                    "_key": "c",
                  },
                  "type": "object",
                },
                {
                  "segment": {
                    "_key": "value",
                  },
                  "type": "string",
                },
              ],
              "value": "c1",
            },
            "upstreamHead": undefined,
          },
          "status": "unresolved",
          "subjectId": "drafts.a",
        },
      ],
    ]
  `)
})

function toSortedArray<Type extends DivergenceAtPath>(): OperatorFunction<Type, Type[]> {
  return pipe(
    toArray(),
    map((array) => array.toSorted(([aPath], [bPath]) => aPath.localeCompare(bPath))),
  )
}
