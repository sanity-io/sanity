import {type SanityDocument} from '@sanity/types'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createMockSanityClient} from '../../../../../../test/mocks/mockSanityClient'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'
import {duplicate} from './duplicate'
import {type OperationArgs} from './types'

vi.mock('../utils/isLiveEditEnabled', () => ({isLiveEditEnabled: vi.fn()}))

beforeEach(() => {
  ;(isLiveEditEnabled as Mock).mockClear()
})

describe('duplicate', () => {
  describe('disabled', () => {
    it('returns NOTHING_TO_DUPLICATE if there is no snapshot', () => {
      expect(
        duplicate.disabled({
          typeName: 'example',
          snapshots: {},
        } as unknown as OperationArgs),
      ).toBe('NOTHING_TO_DUPLICATE')
    })

    it("otherwise the operation isn't disabled", () => {
      expect(
        duplicate.disabled({
          typeName: 'example',
          snapshots: {
            draft: {} as SanityDocument,
            published: {} as SanityDocument,
          },
        } as unknown as OperationArgs),
      ).toBe(false)
    })
  })

  describe('execute', () => {
    it('creates a new document based on the source document', () => {
      const client = createMockSanityClient()

      duplicate.execute(
        {
          client,
          idPair: {
            draftId: 'drafts.my-id',
            publishedId: 'my-id',
          },
          snapshots: {
            draft: {
              _createdAt: '2021-09-14T22:48:02.303Z',
              _rev: 'exampleRev',
              _id: 'drafts.my-id',
              _type: 'example',
              _updatedAt: '2021-09-14T22:48:02.303Z',
              newValue: 'hey',
            },
          },
        } as unknown as OperationArgs,
        'my-duplicate-id',
      )

      expect(client.$log).toMatchSnapshot()
    })

    it('omits timestamp fields from the created document', () => {
      const client = createMockSanityClient()

      duplicate.execute(
        {
          client,
          idPair: {
            draftId: 'drafts.my-id',
            publishedId: 'my-id',
          },
          snapshots: {
            draft: {
              _createdAt: '2021-09-14T22:48:02.303Z',
              _rev: 'exampleRev',
              _id: 'drafts.my-id',
              _type: 'example',
              _updatedAt: '2021-09-14T22:48:02.303Z',
              newValue: 'hey',
            },
          },
        } as unknown as OperationArgs,
        'my-duplicate-id',
      )

      const creation = client.$log.observable.create.find(
        ([document]) => document._id === 'drafts.my-duplicate-id',
      )

      expect(creation[0]).not.toHaveProperty('_createdAt')
      expect(creation[0]).not.toHaveProperty('_updatedAt')
    })

    it('omits the server-managed _system metadata from the created document', () => {
      const client = createMockSanityClient()

      duplicate.execute(
        {
          client,
          idPair: {
            draftId: 'drafts.my-id',
            publishedId: 'my-id',
            versionId: 'versions.rSummer.my-id',
          },
          snapshots: {
            version: {
              _createdAt: '2021-09-14T22:48:02.303Z',
              _rev: 'exampleRev',
              _id: 'versions.rSummer.my-id',
              _type: 'example',
              _updatedAt: '2021-09-14T22:48:02.303Z',
              // A migrated release version carries the source document's group/scope metadata,
              // which must never be attached to the duplicate.
              _system: {
                bundleId: 'rSummer',
                release: {_ref: '_.releases.rSummer', _weak: true},
                group: {_ref: 'my-id', _weak: true},
                scopeId: 'rSummer',
              },
              newValue: 'hey',
            },
          },
        } as unknown as OperationArgs,
        'my-duplicate-id',
      )

      const creation = client.$log.observable.create.find(
        ([document]) => document._id === 'versions.rSummer.my-duplicate-id',
      )

      expect(creation[0]).not.toHaveProperty('_system')
    })

    it('duplicates a variant-scoped version into a base draft instead of fabricating a scope id', () => {
      const client = createMockSanityClient()

      duplicate.execute(
        {
          client,
          idPair: {
            draftId: 'drafts.my-id',
            publishedId: 'my-id',
            versionId: 'versions.varscope.my-id',
          },
          snapshots: {
            version: {
              _createdAt: '2021-09-14T22:48:02.303Z',
              _rev: 'exampleRev',
              _id: 'versions.varscope.my-id',
              _type: 'example',
              _updatedAt: '2021-09-14T22:48:02.303Z',
              _system: {
                bundleId: 'drafts',
                variant: {_ref: '_.variants.french', _weak: true},
                group: {_ref: 'my-id', _weak: true},
                scopeId: 'varscope',
              },
              newValue: 'bonjour',
            },
          },
        } as unknown as OperationArgs,
        'my-duplicate-id',
      )

      // Scope ids are opaque and server-generated: `versions.varscope.my-duplicate-id` must
      // never be fabricated. The variant content becomes a new base draft.
      const creation = client.$log.observable.create.find(
        ([document]) => document._id === 'drafts.my-duplicate-id',
      )

      expect(creation).toBeDefined()
      expect(creation[0]).not.toHaveProperty('_system')
      expect(creation[0].newValue).toBe('bonjour')
      expect(client.$log.observable.create).toHaveLength(1)
    })
  })

  it('applies the `mapDocument` function to the created document', () => {
    const client = createMockSanityClient()

    duplicate.execute(
      {
        client,
        idPair: {
          draftId: 'drafts.my-id',
          publishedId: 'my-id',
        },
        snapshots: {
          draft: {
            _createdAt: '2021-09-14T22:48:02.303Z',
            _rev: 'exampleRev',
            _id: 'drafts.my-id',
            _type: 'example',
            _updatedAt: '2021-09-14T22:48:02.303Z',
            newValue: 'hey',
          },
        },
      } as unknown as OperationArgs,
      'my-duplicate-id',
      {
        mapDocument: (document) => ({
          ...document,
          appendValue: 'appended',
        }),
      },
    )

    const creation = client.$log.observable.create.find(
      ([document]) => document._id === 'drafts.my-duplicate-id',
    )

    expect(client.$log).toMatchSnapshot()
    expect(creation[0].appendValue).toBe('appended')
  })
})
