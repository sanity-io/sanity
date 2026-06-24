import {type SanityClient} from '@sanity/client'
import {describe, expect, it, vi} from 'vitest'

import {type SystemVariant} from '../../types'
import {createVariantScopedDocument} from '../createVariantScopedDocument'

const ACTION_RESULT = {transactionId: 'txn-1'}

const VARIANT: SystemVariant = {
  _id: '_.variants.Ab12cd34',
  _type: 'system.variant',
  _createdAt: '2026-01-01T00:00:00.000Z',
  _updatedAt: '2026-01-01T00:00:00.000Z',
  _rev: 'rev-1',
  conditions: {audience: 'loyal'},
  priority: 0,
}

describe('createVariantScopedDocument', () => {
  it('creates a variant document from a base document in the published perspective', async () => {
    const client = {
      action: vi.fn().mockResolvedValue(ACTION_RESULT),
    }

    await expect(
      createVariantScopedDocument({
        client: client as unknown as SanityClient,
        document: {
          _id: 'drafts.article-1',
          _type: 'article',
          _rev: 'rev-1',
          title: 'Hello',
        },
        variant: VARIANT,
        selectedPerspective: 'published',
      }),
    ).resolves.toEqual(ACTION_RESULT)

    expect(client.action).toHaveBeenCalledWith(
      {
        actionType: 'sanity.action.document.variant.create',
        publishedId: 'article-1',
        variantId: 'Ab12cd34',
        baseId: 'drafts.article-1',
        ifBaseRevisionId: 'rev-1',
      },
      {tag: 'variants.document.create'},
    )
  })

  it('throws when creating from an unsupported release perspective', async () => {
    const client = {
      action: vi.fn().mockResolvedValue(ACTION_RESULT),
    }

    await expect(
      createVariantScopedDocument({
        client: client as unknown as SanityClient,
        document: {
          _id: 'drafts.article-1',
          _type: 'article',
          title: 'Hello',
        },
        variant: VARIANT,
        selectedPerspective: 'my-release',
      }),
    ).rejects.toThrow(
      'Variant document creation is not supported for bundle "my-release". Only "published" and "drafts" bundles are supported.',
    )

    expect(client.action).not.toHaveBeenCalled()
  })

  it('passes drafts bundleId when creating from the drafts perspective', async () => {
    const client = {
      action: vi.fn().mockResolvedValue(ACTION_RESULT),
    }

    await createVariantScopedDocument({
      client: client as unknown as SanityClient,
      document: {
        _id: 'drafts.article-1',
        _type: 'article',
        title: 'Hello',
      },
      variant: VARIANT,
      selectedPerspective: 'drafts',
    })

    expect(client.action).toHaveBeenCalledWith(
      {
        actionType: 'sanity.action.document.variant.create',
        publishedId: 'article-1',
        variantId: 'Ab12cd34',
        baseId: 'drafts.article-1',
        bundleId: 'drafts',
      },
      {tag: 'variants.document.create'},
    )
  })
})
