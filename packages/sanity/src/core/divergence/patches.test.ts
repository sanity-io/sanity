import {type SanityDocument} from '@sanity/types'
import {firstValueFrom, toArray} from 'rxjs'
import {describe, expect, it} from 'vitest'

import {createTakeFromUpstreamPatches, createUpsertResolutionMarkerPatches} from './patches'
import {type DivergenceAtPath} from './readDocumentDivergences'

describe('createUpsertResolutionMarkerPatches', () => {
  it(`sets the \`_systemDivergences\` field if it's missing`, () => {
    const patches = createUpsertResolutionMarkerPatches()
    expect(patches).toMatchInlineSnapshot(`
      [
        {
          "op": {
            "type": "setIfMissing",
            "value": {},
          },
          "path": [
            "_systemDivergences",
          ],
        },
        {
          "op": {
            "type": "setIfMissing",
            "value": [],
          },
          "path": [
            "_systemDivergences",
            "resolutions",
          ],
        },
      ]
    `)
  })

  it(`replaces the provided resolution markers in simple paths`, () => {
    const patches = createUpsertResolutionMarkerPatches(['title', ['revisionX', 'signatureX']])
    expect(patches.slice(2)).toMatchInlineSnapshot(`
      [
        {
          "op": {
            "type": "unset",
          },
          "path": [
            "_systemDivergences",
            "resolutions",
            {
              "_key": "title",
            },
          ],
        },
        {
          "op": {
            "items": [
              {
                "_key": "title",
                "resolutionMarker": [
                  "revisionX",
                  "signatureX",
                ],
              },
            ],
            "position": "after",
            "referenceItem": -1,
            "type": "insert",
          },
          "path": [
            "_systemDivergences",
            "resolutions",
          ],
        },
      ]
    `)
  })

  it(`replaces the provided resolution markers in complex paths`, () => {
    const patches = createUpsertResolutionMarkerPatches([
      'someObject.someArray[key=="keyX"].otherArray[3].someField',
      ['revisionX', 'signatureX'],
    ])
    expect(patches.slice(2)).toMatchInlineSnapshot(`
      [
        {
          "op": {
            "type": "unset",
          },
          "path": [
            "_systemDivergences",
            "resolutions",
            {
              "_key": "someObject.someArray[key=="keyX"].otherArray[3].someField",
            },
          ],
        },
        {
          "op": {
            "items": [
              {
                "_key": "someObject.someArray[key=="keyX"].otherArray[3].someField",
                "resolutionMarker": [
                  "revisionX",
                  "signatureX",
                ],
              },
            ],
            "position": "after",
            "referenceItem": -1,
            "type": "insert",
          },
          "path": [
            "_systemDivergences",
            "resolutions",
          ],
        },
      ]
    `)
  })
})

describe('createTakeFromUpstreamPatches', () => {
  const divergences: DivergenceAtPath[] = [
    [
      'title',
      {
        path: 'title',
        effect: 'set',
        isAddressable: true,
        documentId: 'alpha',
        subjectId: 'drafts.alpha',
        sinceRevisionId: 'alpha@x',
        status: 'unresolved',
        documentType: 'book',
        snapshots: {
          upstreamAtFork: {
            pathWithTypes: [{segment: 'title', type: 'string'}],
            value: 'Alpha',
          },
          upstreamHead: {
            pathWithTypes: [{segment: 'title', type: 'string'}],
            value: 'Beta',
          },
          subjectHead: {
            pathWithTypes: [{segment: 'title', type: 'string'}],
            value: 'Alpha',
          },
        },
      },
    ],
    [
      'author',
      {
        path: 'name',
        effect: 'set',
        isAddressable: true,
        documentId: 'alpha',
        subjectId: 'drafts.alpha',
        sinceRevisionId: 'alpha@x',
        status: 'unresolved',
        documentType: 'book',
        snapshots: {
          upstreamAtFork: {
            pathWithTypes: [{segment: 'title', type: 'string'}],
            value: 'Alice',
          },
          upstreamHead: {
            pathWithTypes: [{segment: 'title', type: 'string'}],
            value: 'Bob',
          },
          subjectHead: {
            pathWithTypes: [{segment: 'title', type: 'string'}],
            value: 'Alice',
          },
        },
      },
    ],
    [
      'image.asset._ref',
      {
        path: 'name',
        effect: 'set',
        isAddressable: true,
        documentId: 'alpha',
        subjectId: 'drafts.alpha',
        sinceRevisionId: 'alpha@x',
        status: 'unresolved',
        documentType: 'book',
        snapshots: {
          upstreamAtFork: {
            pathWithTypes: [
              {segment: 'image', type: 'image'},
              {segment: 'asset', type: 'reference'},
              {segment: '_ref', type: 'string'},
            ],
            value: 'image-1',
          },
          upstreamHead: {
            pathWithTypes: [
              {segment: 'image', type: 'image'},
              {segment: 'asset', type: 'reference'},
              {segment: '_ref', type: 'string'},
            ],
            value: 'image-2',
          },
          subjectHead: {
            pathWithTypes: [
              {segment: 'image', type: 'image'},
              {segment: 'asset', type: 'reference'},
              {segment: '_ref', type: 'string'},
            ],
            value: 'image-1',
          },
        },
      },
    ],
    [
      'dateOfBirth',
      {
        path: 'dateOfBirth',
        effect: 'unset',
        isAddressable: true,
        documentId: 'alpha',
        subjectId: 'drafts.alpha',
        sinceRevisionId: 'alpha@x',
        status: 'unresolved',
        documentType: 'book',
        snapshots: {
          upstreamAtFork: {
            pathWithTypes: [{segment: 'dateOfBirth', type: 'string'}],
            value: '01-01-1800',
          },
          upstreamHead: {
            pathWithTypes: [{segment: 'dateOfBirth', type: 'string'}],
            value: undefined,
          },
          subjectHead: {
            pathWithTypes: [{segment: 'dateOfBirth', type: 'string'}],
            value: '01-01-1800',
          },
        },
      },
    ],
    [
      'placeOfBirth',
      {
        path: 'placeOfBirth',
        effect: 'unset',
        isAddressable: true,
        documentId: 'alpha',
        subjectId: 'drafts.alpha',
        sinceRevisionId: 'alpha@x',
        status: 'unresolved',
        documentType: 'book',
        snapshots: {
          upstreamAtFork: {
            pathWithTypes: [{segment: 'placeOfBirth', type: 'string'}],
            value: 'Nowhere',
          },
          upstreamHead: {
            pathWithTypes: [{segment: 'placeOfBirth', type: 'string'}],
            value: undefined,
          },
          subjectHead: {
            pathWithTypes: [{segment: 'placeOfBirth', type: 'string'}],
            value: 'Nowhere',
          },
        },
      },
    ],
    [
      'notableWorks[1]',
      {
        path: 'notableWorks[1]',
        effect: 'unset',
        isAddressable: true,
        documentId: 'alpha',
        subjectId: 'drafts.alpha',
        sinceRevisionId: 'alpha@x',
        status: 'unresolved',
        documentType: 'book',
        snapshots: {
          upstreamAtFork: {
            pathWithTypes: [
              {segment: 'notableWorks', type: 'array'},
              {segment: 1, type: 'string'},
            ],
            value: 'Placeholder book',
          },
          upstreamHead: {
            pathWithTypes: [
              {segment: 'notableWorks', type: 'array'},
              {segment: 1, type: 'string'},
            ],
            value: undefined,
          },
          subjectHead: {
            pathWithTypes: [
              {segment: 'notableWorks', type: 'array'},
              {segment: 1, type: 'string'},
            ],
            value: 'Placeholder book',
          },
        },
      },
    ],
    [
      'highlight._type',
      {
        path: 'highlight._type',
        effect: 'set',
        isAddressable: true,
        documentId: 'alpha',
        subjectId: 'drafts.alpha',
        sinceRevisionId: 'alpha@x',
        status: 'unresolved',
        documentType: 'book',
        snapshots: {
          upstreamAtFork: {
            pathWithTypes: [
              {segment: 'highlight', type: 'book'},
              {segment: '_type', type: 'string'},
            ],
            value: 'book',
          },
          upstreamHead: {
            pathWithTypes: [
              {segment: 'highlight', type: 'book'},
              {segment: '_type', type: 'string'},
            ],
            value: 'fact',
          },
          subjectHead: {
            pathWithTypes: [
              {segment: 'highlight', type: 'book'},
              {segment: '_type', type: 'string'},
            ],
            value: 'book',
          },
        },
      },
    ],
    [
      'highlight.value._type',
      {
        path: 'highlight.value._type',
        effect: 'set',
        isAddressable: true,
        documentId: 'alpha',
        subjectId: 'drafts.alpha',
        sinceRevisionId: 'alpha@x',
        status: 'unresolved',
        documentType: 'book',
        snapshots: {
          upstreamAtFork: {
            pathWithTypes: [
              {segment: 'highlight', type: 'book'},
              {segment: 'value', type: 'rich'},
              {segment: '_type', type: 'string'},
            ],
            value: 'rich',
          },
          upstreamHead: {
            pathWithTypes: [
              {segment: 'highlight', type: 'book'},
              {segment: 'value', type: 'plain'},
              {segment: '_type', type: 'string'},
            ],
            value: 'plain',
          },
          subjectHead: {
            pathWithTypes: [
              {segment: 'highlight', type: 'book'},
              {segment: 'value', type: 'rich'},
              {segment: '_type', type: 'string'},
            ],
            value: 'rich',
          },
        },
      },
    ],
    [
      'highlight.value.value',
      {
        path: 'highlight.value.value',
        effect: 'set',
        isAddressable: true,
        documentId: 'alpha',
        subjectId: 'drafts.alpha',
        sinceRevisionId: 'alpha@x',
        status: 'unresolved',
        documentType: 'book',
        snapshots: {
          upstreamAtFork: {
            pathWithTypes: [
              {segment: 'highlight', type: 'book'},
              {segment: 'value', type: 'rich'},
              {segment: 'value', type: 'string'},
            ],
            value: 'Some book',
          },
          upstreamHead: {
            pathWithTypes: [
              {segment: 'highlight', type: 'book'},
              {segment: 'value', type: 'plain'},
              {segment: 'value', type: 'string'},
            ],
            value: 'Some interesting info',
          },
          subjectHead: {
            pathWithTypes: [
              {segment: 'highlight', type: 'book'},
              {segment: 'value', type: 'rich'},
              {segment: '_type', type: 'string'},
            ],
            value: 'Some book',
          },
        },
      },
    ],
  ]

  const upstreamHead: SanityDocument = {
    _id: 'alpha',
    _type: 'book',
    _rev: 'x',
    _createdAt: '2026-03-09T09:00:00Z',
    _updatedAt: '2026-03-09T09:00:00Z',
    title: 'Beta',
    author: 'Alice',
    image: {
      _type: 'image',
      asset: {
        _ref: 'image-2',
        _type: 'reference',
      },
    },
    notableWorks: ['Some book', 'Some other book'],
    highlight: {
      _type: 'fact',
      value: {
        _type: 'plain',
        value: 'Some interesting info',
      },
    },
  }

  it('sets chosen `set` divergences in simple paths', async () => {
    const patchesTitle = await firstValueFrom(
      createTakeFromUpstreamPatches(upstreamHead, divergences, ['title']).pipe(toArray()),
    )

    expect(patchesTitle).toMatchInlineSnapshot(`
      [
        {
          "op": {
            "type": "set",
            "value": "Beta",
          },
          "path": [
            "title",
          ],
        },
      ]
    `)

    const patchesAll = await firstValueFrom(
      createTakeFromUpstreamPatches(upstreamHead, divergences, ['title'], ['author']).pipe(
        toArray(),
      ),
    )

    expect(patchesAll).toMatchInlineSnapshot(`
      [
        {
          "op": {
            "type": "set",
            "value": "Beta",
          },
          "path": [
            "title",
          ],
        },
        {
          "op": {
            "type": "set",
            "value": "Alice",
          },
          "path": [
            "author",
          ],
        },
      ]
    `)
  })

  it('sets chosen `set` divergences in complex paths', async () => {
    const patches = await firstValueFrom(
      createTakeFromUpstreamPatches(upstreamHead, divergences, ['image', 'asset', '_ref']).pipe(
        toArray(),
      ),
    )

    expect(patches).toMatchInlineSnapshot(`
      [
        {
          "op": {
            "type": "set",
            "value": "image-2",
          },
          "path": [
            "image",
            "asset",
            "_ref",
          ],
        },
      ]
    `)
  })

  it('unsets chosen `unset` divergences in simple paths', async () => {
    const patchesDateOfBirth = await firstValueFrom(
      createTakeFromUpstreamPatches(upstreamHead, divergences, ['dateOfBirth']).pipe(toArray()),
    )

    expect(patchesDateOfBirth).toMatchInlineSnapshot(`
      [
        {
          "op": {
            "type": "unset",
          },
          "path": [
            "dateOfBirth",
          ],
        },
      ]
    `)

    const patchesAll = await firstValueFrom(
      createTakeFromUpstreamPatches(
        upstreamHead,
        divergences,
        ['dateOfBirth'],
        ['placeOfBirth'],
      ).pipe(toArray()),
    )

    expect(patchesAll).toMatchInlineSnapshot(`
      [
        {
          "op": {
            "type": "unset",
          },
          "path": [
            "dateOfBirth",
          ],
        },
        {
          "op": {
            "type": "unset",
          },
          "path": [
            "placeOfBirth",
          ],
        },
      ]
    `)
  })

  it('unsets chosen `unset` divergences in complex paths', async () => {
    const patches = await firstValueFrom(
      createTakeFromUpstreamPatches(upstreamHead, divergences, ['notableWorks', 1]).pipe(toArray()),
    )

    expect(patches).toMatchInlineSnapshot(`
      [
        {
          "op": {
            "type": "unset",
          },
          "path": [
            "notableWorks",
            1,
          ],
        },
      ]
    `)
  })

  it('sets all `_type` divergences that are siblings or ancestors of the chosen divergences', async () => {
    const patches = await firstValueFrom(
      createTakeFromUpstreamPatches(upstreamHead, divergences, [
        'highlight',
        'value',
        'value',
      ]).pipe(toArray()),
    )

    expect(patches).toMatchInlineSnapshot(`
      [
        {
          "op": {
            "type": "set",
            "value": "fact",
          },
          "path": [
            "highlight",
            "_type",
          ],
        },
        {
          "op": {
            "type": "set",
            "value": "plain",
          },
          "path": [
            "highlight",
            "value",
            "_type",
          ],
        },
        {
          "op": {
            "type": "set",
            "value": "Some interesting info",
          },
          "path": [
            "highlight",
            "value",
            "value",
          ],
        },
      ]
    `)
  })
})
