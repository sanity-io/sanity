import {renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {
  activeASAPRelease,
  activeScheduledRelease,
} from '../../releases/__fixtures__/release.fixture'
import {useDocumentVersions} from '../../releases/hooks/useDocumentVersions'
import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {useActiveReleases} from '../../releases/store/useActiveReleases'
import {useVariantPendingReleases} from './useVariantPendingReleases'

vi.mock('../../releases/hooks/useDocumentVersions', () => ({
  useDocumentVersions: vi.fn(),
}))

vi.mock('../../releases/store/useActiveReleases', () => ({
  useActiveReleases: vi.fn(),
}))

const documentId = 'article-123'
const variantRef = '_.variants.test'

function createVersion(
  _id: string,
  system: Partial<VersionInfoDocumentStub['_system']>,
): VersionInfoDocumentStub {
  return {
    _id,
    _rev: `${_id}-rev`,
    _createdAt: '2024-01-01T00:00:00Z',
    _updatedAt: '2024-01-02T00:00:00Z',
    _system: {
      group: {_ref: documentId, _weak: true},
      ...system,
    },
  }
}

const baseVersionInASAP = createVersion('versions.rASAP.article-123', {
  bundleId: 'rASAP',
  release: {_ref: activeASAPRelease._id, _weak: true},
})

const variantVersionInASAP = createVersion('opaque-variant-asap', {
  bundleId: 'rASAP',
  release: {_ref: activeASAPRelease._id, _weak: true},
  variant: {_ref: variantRef, _weak: true},
})

const variantVersionInScheduled = createVersion('opaque-variant-scheduled', {
  bundleId: 'rActive',
  release: {_ref: activeScheduledRelease._id, _weak: true},
  variant: {_ref: variantRef, _weak: true},
})

describe('useVariantPendingReleases', () => {
  const mockUseDocumentVersions = useDocumentVersions as Mock<typeof useDocumentVersions>
  const mockUseActiveReleases = useActiveReleases as Mock<typeof useActiveReleases>

  function mockVersions(versions: VersionInfoDocumentStub[]) {
    mockUseDocumentVersions.mockReturnValue({
      data: [],
      versions,
      error: null,
      loading: false,
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseActiveReleases.mockReturnValue({
      data: [activeASAPRelease, activeScheduledRelease],
      dispatch: vi.fn(),
      error: undefined,
      loading: false,
    })
  })

  it('excludes releases the variant already has a version in', () => {
    mockVersions([variantVersionInASAP])

    const {result} = renderHook(() => useVariantPendingReleases({documentId, variantRef}))

    expect(result.current).toEqual([activeScheduledRelease])
  })

  it('ignores base versions when resolving pending releases for a variant', () => {
    mockVersions([baseVersionInASAP])

    const {result} = renderHook(() => useVariantPendingReleases({documentId, variantRef}))

    expect(result.current).toEqual([activeASAPRelease, activeScheduledRelease])
  })

  it('ignores variant versions when resolving pending releases for the base document', () => {
    mockVersions([variantVersionInASAP, variantVersionInScheduled])

    const {result} = renderHook(() =>
      useVariantPendingReleases({documentId, variantRef: undefined}),
    )

    expect(result.current).toEqual([activeASAPRelease, activeScheduledRelease])
  })

  it('returns no releases when the variant is already in all of them', () => {
    mockVersions([variantVersionInASAP, variantVersionInScheduled])

    const {result} = renderHook(() => useVariantPendingReleases({documentId, variantRef}))

    expect(result.current).toEqual([])
  })

  it('keeps a stable reference across re-renders', () => {
    mockVersions([variantVersionInASAP])

    const {result, rerender} = renderHook(() => useVariantPendingReleases({documentId, variantRef}))
    const first = result.current
    rerender()

    expect(result.current).toBe(first)
  })
})
