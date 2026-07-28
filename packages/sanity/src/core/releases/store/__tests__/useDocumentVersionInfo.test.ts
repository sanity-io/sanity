import {renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {type VersionInfoDocumentStub} from '../types'
import {useDocumentVersionInfo} from '../useDocumentVersionInfo'

vi.mock('../../hooks/useDocumentVersions', () => ({
  useDocumentVersions: vi.fn(),
}))

const {useDocumentVersions} = vi.mocked(await import('../../hooks/useDocumentVersions'))

const publishedId = 'article-123'

const publishedVersion: VersionInfoDocumentStub = {
  _id: publishedId,
  _rev: 'published-rev',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-02T00:00:00Z',
  _system: {
    group: {_ref: publishedId, _weak: true},
  },
}

const draftVersion: VersionInfoDocumentStub = {
  _id: 'drafts.article-123',
  _rev: 'draft-rev',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-03T00:00:00Z',
  _system: {
    bundleId: 'drafts',
    group: {_ref: publishedId, _weak: true},
  },
}

const releaseVersion: VersionInfoDocumentStub = {
  _id: 'versions.release1.article-123',
  _rev: 'release-rev',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-04T00:00:00Z',
  _system: {
    bundleId: 'release1',
    release: {_ref: '_.releases.release1', _weak: true},
    group: {_ref: publishedId, _weak: true},
    scopeId: 'release1',
  },
}

const variantVersion: VersionInfoDocumentStub = {
  _id: 'versions.scope1.article-123',
  _rev: 'variant-rev',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-05T00:00:00Z',
  _system: {
    bundleId: 'drafts',
    variant: {_ref: '_.variants.test', _weak: true},
    group: {_ref: publishedId, _weak: true},
    scopeId: 'scope1',
  },
}

describe('useDocumentVersionInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps loading state from useDocumentVersions', () => {
    useDocumentVersions.mockReturnValue({
      data: [],
      versions: [],
      error: null,
      loading: true,
    })

    const {result} = renderHook(() => useDocumentVersionInfo(publishedId))

    expect(result.current).toEqual({
      isLoading: true,
      draft: undefined,
      published: undefined,
      versions: {},
    })
    expect(useDocumentVersions).toHaveBeenCalledWith({documentId: publishedId})
  })

  it('derives the legacy shape from useDocumentVersions.versions', () => {
    useDocumentVersions.mockReturnValue({
      data: [publishedId, draftVersion._id, releaseVersion._id],
      versions: [publishedVersion, draftVersion, releaseVersion, variantVersion],
      error: null,
      loading: false,
    })

    const {result} = renderHook(() => useDocumentVersionInfo(`drafts.${publishedId}`))

    expect(result.current).toEqual({
      isLoading: false,
      draft: draftVersion,
      published: publishedVersion,
      versions: {
        release1: releaseVersion,
      },
    })
  })
})
