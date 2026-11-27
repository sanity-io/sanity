import {act, renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {variantAlphaAudience} from '../../__fixtures__/variants.fixture'
import {useVariantDocumentOperations} from '../useVariantDocumentOperations'

const clientMock = vi.hoisted(() => {
  const client = {
    action: vi.fn(),
    withConfig: vi.fn(() => client),
  }
  return client
})

const telemetryMock = vi.hoisted(() => ({
  log: vi.fn(),
}))

vi.mock('@sanity/telemetry/react', () => ({
  useTelemetry: vi.fn(() => telemetryMock),
}))

vi.mock('../../../hooks/useClient', () => ({
  useClient: vi.fn(() => clientMock),
}))

describe('useVariantDocumentOperations', () => {
  beforeEach(() => {
    clientMock.action.mockResolvedValue({transactionId: 'txn-1'})
  })

  it('reports a version copied from an existing version into drafts', async () => {
    const {result} = renderHook(() => useVariantDocumentOperations())

    await act(async () => {
      await result.current.createVariantDocument({
        baseId: 'drafts.article-1',
        documentGroupId: 'article-1',
        variant: variantAlphaAudience,
        selectedPerspective: 'drafts',
        location: 'not_in_variant_banner',
      })
    })

    expect(clientMock.action).toHaveBeenCalledTimes(1)
    expect(telemetryMock.log).toHaveBeenCalledWith(
      expect.objectContaining({name: 'Variant Version Created'}),
      {location: 'not_in_variant_banner', bundle: 'drafts', fromExistingVersion: true},
    )
  })

  it('reports a version started from an initial value in a release', async () => {
    const {result} = renderHook(() => useVariantDocumentOperations())

    await act(async () => {
      await result.current.createVariantDocument({
        document: {_type: 'article'},
        documentGroupId: 'article-1',
        variant: variantAlphaAudience,
        selectedPerspective: 'rSummer',
        location: 'document_group_inventory',
      })
    })

    expect(telemetryMock.log).toHaveBeenCalledWith(
      expect.objectContaining({name: 'Variant Version Created'}),
      {location: 'document_group_inventory', bundle: 'release', fromExistingVersion: false},
    )
  })

  it('reports the variant of the published document', async () => {
    const {result} = renderHook(() => useVariantDocumentOperations())

    await act(async () => {
      await result.current.createVariantDocument({
        baseId: 'article-1',
        documentGroupId: 'article-1',
        variant: variantAlphaAudience,
        selectedPerspective: 'published',
        location: 'version_context_menu',
      })
    })

    expect(telemetryMock.log).toHaveBeenCalledWith(
      expect.objectContaining({name: 'Variant Version Created'}),
      {location: 'version_context_menu', bundle: 'published', fromExistingVersion: true},
    )
  })

  it('reports nothing when the create action fails', async () => {
    const error = new Error('create failed')
    clientMock.action.mockRejectedValue(error)
    const {result} = renderHook(() => useVariantDocumentOperations())

    await act(async () => {
      await expect(
        result.current.createVariantDocument({
          baseId: 'drafts.article-1',
          documentGroupId: 'article-1',
          variant: variantAlphaAudience,
          selectedPerspective: 'drafts',
          location: 'not_in_variant_banner',
        }),
      ).rejects.toBe(error)
    })

    expect(telemetryMock.log).not.toHaveBeenCalled()
  })
})
