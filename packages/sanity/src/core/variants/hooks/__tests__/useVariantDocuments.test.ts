import {renderHook, waitFor} from '@testing-library/react'
import {of} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {resetBundleDocumentsCacheForTests} from '../../../releases/tool/detail/useBundleDocuments'
import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../../../releases/util/releasesClient'
import {variantAlphaAudience} from '../../__fixtures__/variants.fixture'
import {useVariantDocuments} from '../useVariantDocuments'

const validateDocumentWithReferencesMock = vi.hoisted(() =>
  vi.fn(() =>
    of({
      isValidating: false,
      validation: [{level: 'error', message: 'Title is required', path: ['title']}],
      revision: 'rev-1',
    }),
  ),
)

const documentPreviewStoreMock = vi.hoisted(() => ({
  unstable_observeDocumentIdSet: vi.fn(() => of({status: 'connected' as const, documentIds: []})),
  unstable_observeDocument: vi.fn(() => of(null)),
  unstable_observeDocumentPairAvailability: vi.fn(() =>
    of({published: {available: true}, draft: {available: true}}),
  ),
}))

vi.mock('../../../validation', async (importOriginal) => ({
  ...(await importOriginal()),
  validateDocumentWithReferences: validateDocumentWithReferencesMock,
}))

vi.mock('../../../store/datastores', () => ({
  useDocumentPreviewStore: vi.fn(() => documentPreviewStoreMock),
}))

describe('useVariantDocuments', () => {
  beforeEach(() => {
    resetBundleDocumentsCacheForTests()
    validateDocumentWithReferencesMock.mockClear()
    documentPreviewStoreMock.unstable_observeDocumentIdSet.mockReset()
    documentPreviewStoreMock.unstable_observeDocument.mockReset()
    documentPreviewStoreMock.unstable_observeDocumentIdSet.mockReturnValue(
      of({status: 'connected' as const, documentIds: []}),
    )
    documentPreviewStoreMock.unstable_observeDocument.mockReturnValue(of(null))
  })

  it('returns an empty result when no variant id is provided', async () => {
    const wrapper = await createTestProvider()

    const {result} = renderHook(() => useVariantDocuments(undefined), {wrapper})

    expect(result.current).toEqual({
      loading: false,
      results: [],
      error: null,
    })
    expect(documentPreviewStoreMock.unstable_observeDocumentIdSet).not.toHaveBeenCalled()
  })

  it('queries variant membership with the fallback _system.variant filter', async () => {
    const wrapper = await createTestProvider()

    renderHook(() => useVariantDocuments(variantAlphaAudience._id), {wrapper})

    expect(documentPreviewStoreMock.unstable_observeDocumentIdSet).toHaveBeenCalledWith(
      '_system.variant._ref == $variantId',
      {variantId: variantAlphaAudience._id},
      {apiVersion: RELEASES_STUDIO_CLIENT_OPTIONS.apiVersion},
    )
  })

  it('validates each variant document and exposes hasError on the result', async () => {
    const document = {
      _id: 'drafts.scope.article-1',
      _type: 'article',
      _rev: 'rev-1',
      _createdAt: '2025-06-01T00:00:00Z',
      _updatedAt: '2025-06-01T00:00:00Z',
      _system: {
        bundleId: 'drafts',
        release: null,
        variant: {_ref: variantAlphaAudience._id, _weak: true},
        group: {_ref: 'article-1', _weak: true},
        scopeId: null,
      },
    }

    documentPreviewStoreMock.unstable_observeDocumentIdSet.mockReturnValue(
      of({status: 'connected' as const, documentIds: [document._id]}),
    )
    documentPreviewStoreMock.unstable_observeDocument.mockReturnValue(of(document))

    const wrapper = await createTestProvider()
    const {result} = renderHook(() => useVariantDocuments(variantAlphaAudience._id), {wrapper})

    await waitFor(() => {
      expect(result.current.results).toHaveLength(1)
    })

    expect(validateDocumentWithReferencesMock).toHaveBeenCalled()
    expect(result.current.results[0]?.validation.hasError).toBe(true)
    expect(result.current.results[0]?.validation.validation).toEqual([
      {level: 'error', message: 'Title is required', path: ['title']},
    ])
    expect(result.current.results[0]?.version).toEqual({
      documentId: document._id,
      bundleId: 'drafts',
      releaseRef: null,
      updatedAt: document._updatedAt,
    })
  })
})
