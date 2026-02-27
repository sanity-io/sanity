import {type SanityDocument} from '@sanity/types'
import {expect, it} from 'vitest'

import {type EditStateFor} from './document-pair/editState'
import {selectUpstreamVersion} from './selectUpstreamVersion'

const stubDocument: SanityDocument = {
  _id: 'x',
  _rev: 'x',
  _type: 'x',
  _createdAt: '2025-10-14',
  _updatedAt: '2025-10-14',
}

const stubEditState: Omit<EditStateFor, 'published' | 'draft' | 'version'> = {
  id: 'editStateX',
  liveEdit: false,
  liveEditSchemaType: false,
  ready: true,
  release: undefined,
  transactionSyncLock: null,
  type: 'x',
}

it('selects the correct document', () => {
  expect(
    selectUpstreamVersion({
      ...stubEditState,
      published: {
        ...stubDocument,
        _id: 'published',
      },
      draft: {
        ...stubDocument,
        _id: 'draft',
      },
      version: {
        ...stubDocument,
        _id: 'version',
      },
    }),
  ).toHaveProperty('_id', 'version')

  expect(
    selectUpstreamVersion({
      ...stubEditState,
      published: {
        ...stubDocument,
        _id: 'published',
      },
      draft: {
        ...stubDocument,
        _id: 'draft',
      },
      version: null,
    }),
  ).toHaveProperty('_id', 'published')

  expect(
    selectUpstreamVersion({
      ...stubEditState,
      published: null,
      draft: {
        ...stubDocument,
        _id: 'draft',
      },
      version: null,
    }),
  ).toBe(null)

  expect(
    selectUpstreamVersion({
      ...stubEditState,
      published: null,
      draft: null,
      version: null,
    }),
  ).toBe(null)
})
