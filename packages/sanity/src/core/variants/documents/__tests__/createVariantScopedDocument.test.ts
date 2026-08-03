import {type ReleaseDocument, type SanityClient} from '@sanity/client'
import {describe, expect, it, vi} from 'vitest'

import {RELEASE_DOCUMENT_TYPE} from '../../../releases/store/constants'
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

const releaseDocument: ReleaseDocument = {
  _id: '_.releases.rSummer123',
  name: 'rSummer123',
  _type: RELEASE_DOCUMENT_TYPE,
  _rev: 'rev',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-01T00:00:00Z',
  state: 'active',
  metadata: {
    title: 'Summer',
    releaseType: 'asap',
  },
}

describe('createVariantScopedDocument', () => {
  it('creates a variant document from a base document in the published perspective', async () => {
    const client = {
      action: vi.fn().mockResolvedValue(ACTION_RESULT),
    }

    await expect(
      createVariantScopedDocument({
        client: client as unknown as SanityClient,
        baseId: 'drafts.article-1',
        ifBaseRevisionId: 'rev-1',
        documentGroupId: 'article-1',
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

    // `toHaveBeenCalledWith` does not distinguish absent keys from `undefined`
    // values, so assert explicitly that no bundle is sent for the published
    // perspective.
    expect(client.action.mock.calls[0][0]).not.toHaveProperty('bundleId')
  })

  it('creates a variant document from an in-memory document', async () => {
    const client = {
      action: vi.fn().mockResolvedValue(ACTION_RESULT),
    }

    await expect(
      createVariantScopedDocument({
        client: client as unknown as SanityClient,
        document: {
          _type: 'article',
          title: 'Hello',
        },
        documentGroupId: 'article-1',
        variant: VARIANT,
        selectedPerspective: 'published',
      }),
    ).resolves.toEqual(ACTION_RESULT)

    expect(client.action).toHaveBeenCalledWith(
      {
        actionType: 'sanity.action.document.variant.create',
        publishedId: 'article-1',
        variantId: 'Ab12cd34',
        document: {
          _type: 'article',
          title: 'Hello',
        },
      },
      {tag: 'variants.document.create'},
    )
  })

  it('passes release bundleId when creating from a release perspective string', async () => {
    const client = {
      action: vi.fn().mockResolvedValue(ACTION_RESULT),
    }

    await createVariantScopedDocument({
      client: client as unknown as SanityClient,
      baseId: 'drafts.article-1',
      documentGroupId: 'article-1',
      variant: VARIANT,
      selectedPerspective: 'my-release',
    })

    expect(client.action).toHaveBeenCalledWith(
      {
        actionType: 'sanity.action.document.variant.create',
        publishedId: 'article-1',
        variantId: 'Ab12cd34',
        baseId: 'drafts.article-1',
        bundleId: 'my-release',
      },
      {tag: 'variants.document.create'},
    )

    // `toHaveBeenCalledWith` does not distinguish absent keys from `undefined`
    // values, so assert explicitly that no revision constraint is sent when
    // none is provided.
    expect(client.action.mock.calls[0][0]).not.toHaveProperty('ifBaseRevisionId')
  })

  it('passes release bundleId when creating from a release document perspective', async () => {
    const client = {
      action: vi.fn().mockResolvedValue(ACTION_RESULT),
    }

    await createVariantScopedDocument({
      client: client as unknown as SanityClient,
      baseId: 'versions.rSummer123.article-1',
      documentGroupId: 'article-1',
      variant: VARIANT,
      selectedPerspective: releaseDocument,
    })

    expect(client.action).toHaveBeenCalledWith(
      {
        actionType: 'sanity.action.document.variant.create',
        publishedId: 'article-1',
        variantId: 'Ab12cd34',
        baseId: 'versions.rSummer123.article-1',
        bundleId: 'rSummer123',
      },
      {tag: 'variants.document.create'},
    )
  })

  it('passes drafts bundleId when creating from the drafts perspective', async () => {
    const client = {
      action: vi.fn().mockResolvedValue(ACTION_RESULT),
    }

    await createVariantScopedDocument({
      client: client as unknown as SanityClient,
      baseId: 'drafts.article-1',
      documentGroupId: 'article-1',
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

  it('forwards the abort signal to the action request when creating from a base document', async () => {
    const client = {
      action: vi.fn().mockResolvedValue(ACTION_RESULT),
    }
    const controller = new AbortController()

    await createVariantScopedDocument({
      client: client as unknown as SanityClient,
      baseId: 'drafts.article-1',
      documentGroupId: 'article-1',
      variant: VARIANT,
      selectedPerspective: 'published',
      signal: controller.signal,
    })

    expect(client.action).toHaveBeenCalledWith(expect.anything(), {
      tag: 'variants.document.create',
      signal: controller.signal,
    })
  })

  it('forwards the abort signal to the action request when creating from an in-memory document', async () => {
    const client = {
      action: vi.fn().mockResolvedValue(ACTION_RESULT),
    }
    const controller = new AbortController()

    await createVariantScopedDocument({
      client: client as unknown as SanityClient,
      document: {_type: 'article'},
      documentGroupId: 'article-1',
      variant: VARIANT,
      selectedPerspective: 'published',
      signal: controller.signal,
    })

    expect(client.action).toHaveBeenCalledWith(expect.anything(), {
      tag: 'variants.document.create',
      signal: controller.signal,
    })
  })
})
