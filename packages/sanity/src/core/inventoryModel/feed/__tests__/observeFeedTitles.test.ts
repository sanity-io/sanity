import {type SchemaType} from '@sanity/types'
import {firstValueFrom, of, throwError} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {buildInventoryIndex} from '../../buildInventoryIndex'
import {type VersionStub} from '../../types'
import {getFeedTitleRows, type ObserveFeedPreview, observeFeedTitles} from '../observeFeedTitles'

function stub(overrides: Pick<VersionStub, '_id' | 'groupId' | 'kind'> & Partial<VersionStub>) {
  return {
    _type: 'product',
    _updatedAt: '2026-11-01T00:00:00Z',
    variantId: undefined,
    bundle: overrides.kind === 'draft' ? 'drafts' : overrides.kind,
    goingToUnpublish: false,
    ...overrides,
  } satisfies VersionStub
}

const index = buildInventoryIndex({
  versions: [
    stub({_id: 'drafts.jacket', groupId: 'jacket', kind: 'draft'}),
    stub({_id: 'jacket', groupId: 'jacket', kind: 'published'}),
    stub({_id: 'drafts.shell', groupId: 'shell', kind: 'draft'}),
    stub({_id: 'versions.agent-x.cap', groupId: 'cap', kind: 'agent', bundle: 'agent-x'}),
    stub({_id: 'map', groupId: 'map', kind: 'published', _type: 'unknownType'}),
  ],
  releases: new Map(),
})

const productType = {name: 'product'} as SchemaType
const getSchemaType = (typeName: string) => (typeName === 'product' ? productType : undefined)

describe('getFeedTitleRows', () => {
  it('reads each visible document from its first version, skipping unloaded ones', () => {
    expect(getFeedTitleRows(index, ['jacket', 'shell', 'cap', 'missing', 'jacket'])).toEqual([
      {groupId: 'jacket', _id: 'jacket', _type: 'product'},
      {groupId: 'shell', _id: 'drafts.shell', _type: 'product'},
    ])
  })
})

describe('observeFeedTitles', () => {
  it('observes only the rows it is given, and maps missing types and failures to undefined', async () => {
    const observeForPreview = vi.fn<ObserveFeedPreview>((value) =>
      value._id === 'drafts.shell'
        ? throwError(() => new Error('preview failed'))
        : of({snapshot: {title: `Title of ${value._id}`}}),
    )

    const titles = await firstValueFrom(
      observeFeedTitles({
        rows: [
          {groupId: 'jacket', _id: 'jacket', _type: 'product'},
          {groupId: 'shell', _id: 'drafts.shell', _type: 'product'},
          {groupId: 'map', _id: 'map', _type: 'unknownType'},
        ],
        observeForPreview,
        getSchemaType,
      }),
    )

    expect([...titles]).toEqual([
      ['jacket', 'Title of jacket'],
      ['shell', undefined],
      ['map', undefined],
    ])
    expect(observeForPreview).toHaveBeenCalledTimes(2)
  })

  it('emits an empty map when no rows are visible', async () => {
    const observeForPreview = vi.fn<ObserveFeedPreview>()
    const titles = await firstValueFrom(
      observeFeedTitles({rows: [], observeForPreview, getSchemaType}),
    )
    expect(titles.size).toBe(0)
    expect(observeForPreview).not.toHaveBeenCalled()
  })
})
