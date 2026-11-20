import {createClient, SanityClient} from '@sanity/client'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {VARIANTS_STUDIO_CLIENT_OPTIONS} from '../../store/constants'
import {duplicateVariantDocuments} from '../duplicateVariantDocuments'

const NEW_VARIANT = {_id: '_.variants.Copy1234' as const}

const client = createClient({
  projectId: 'project',
  dataset: 'dataset',
  apiVersion: VARIANTS_STUDIO_CLIENT_OPTIONS.apiVersion,
  useCdn: false,
})

describe('duplicateVariantDocuments', () => {
  // `variantsApiClient` sends the actions from a client cloned with `withConfig`, so the spy sits on
  // the prototype every clone shares.
  const action = vi.spyOn(SanityClient.prototype, 'action')

  beforeEach(() => {
    action.mockResolvedValue({transactionId: 'txn-1'})
  })

  afterEach(() => {
    action.mockReset()
  })

  it('sends one create action per document version in a single transaction', async () => {
    await expect(
      duplicateVariantDocuments({
        client,
        variant: NEW_VARIANT,
        documents: [
          {documentGroupId: 'article-1', baseId: 'drafts.scope.article-1', perspective: 'drafts'},
          {
            documentGroupId: 'article-1',
            baseId: 'versions.rASAP.scope.article-1',
            perspective: 'rASAP',
          },
          {documentGroupId: 'live-1', baseId: 'versions.scope.live-1', perspective: 'published'},
        ],
      }),
    ).resolves.toEqual({transactionId: 'txn-1'})

    expect(action).toHaveBeenCalledTimes(1)
    expect(action).toHaveBeenCalledWith(
      [
        {
          actionType: 'sanity.action.document.variant.create',
          variantId: 'Copy1234',
          publishedId: 'article-1',
          baseId: 'drafts.scope.article-1',
          bundleId: 'drafts',
        },
        {
          actionType: 'sanity.action.document.variant.create',
          variantId: 'Copy1234',
          publishedId: 'article-1',
          baseId: 'versions.rASAP.scope.article-1',
          bundleId: 'rASAP',
        },
        {
          actionType: 'sanity.action.document.variant.create',
          variantId: 'Copy1234',
          publishedId: 'live-1',
          baseId: 'versions.scope.live-1',
        },
      ],
      {tag: 'variants.duplicate.documents'},
    )
    // The published copy omits `bundleId`, which the action reads as the published bundle.
    expect(action.mock.calls[0]![0]).toSatisfy(
      (actions) => Array.isArray(actions) && !('bundleId' in actions[2]),
    )
  })

  it('sends nothing when there is nothing to copy', async () => {
    await expect(
      duplicateVariantDocuments({client, variant: NEW_VARIANT, documents: []}),
    ).resolves.toBeUndefined()

    expect(action).not.toHaveBeenCalled()
  })

  it('rejects when the transaction fails, so no document is reported as copied', async () => {
    const error = new Error('transaction failed')
    action.mockRejectedValue(error)

    await expect(
      duplicateVariantDocuments({
        client,
        variant: NEW_VARIANT,
        documents: [
          {documentGroupId: 'article-1', baseId: 'drafts.scope.article-1', perspective: 'drafts'},
        ],
      }),
    ).rejects.toBe(error)
  })
})
