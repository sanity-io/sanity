import {type ReleaseDocument} from '@sanity/client'
import {renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {
  activeASAPRelease,
  activeScheduledRelease,
} from '../../releases/__fixtures__/release.fixture'
import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {useHasCardinalityOneReleaseVersions} from './useHasCardinalityOneReleaseVersions'

vi.mock('../../releases/hooks/useDocumentVersions')
vi.mock('../../releases/store/useActiveReleases')

const {useDocumentVersions} = vi.mocked(await import('../../releases/hooks/useDocumentVersions'))
const {useActiveReleases} = vi.mocked(await import('../../releases/store/useActiveReleases'))

const cardinalityOneRelease: ReleaseDocument = {
  ...activeScheduledRelease,
  _id: '_.releases.scheduled-draft',
  name: 'scheduled-draft',
  metadata: {
    ...activeScheduledRelease.metadata,
    title: 'Scheduled Draft',
    cardinality: 'one',
  },
}

const mockActiveReleasesReturn = {
  loading: false,
  error: undefined,
  dispatch: vi.fn(),
  byId: new Map<string, ReleaseDocument>(),
}

const VARIANT_ID = '_.variants.loyal'

function createStub(
  _id: string,
  system: Omit<VersionInfoDocumentStub['_system'], 'group'> = {},
): VersionInfoDocumentStub {
  return {
    _id,
    _rev: 'rev',
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-01-01T00:00:00.000Z',
    _type: 'article',
    _system: {group: {_ref: 'test-document', _weak: true}, ...system},
  }
}

function mockDocumentVersions(versions: VersionInfoDocumentStub[]) {
  useDocumentVersions.mockReturnValue({
    loading: false,
    error: null,
    data: versions.map((version) => version._id),
    versions,
  })
}

const baseScheduledVersion = createStub('versions.scheduled-draft.test-document', {
  bundleId: 'scheduled-draft',
})
const variantScheduledVersion = createStub('versions.scope-loyal.test-document', {
  bundleId: 'scheduled-draft',
  scopeId: 'scope-loyal',
  variants: [{_ref: VARIANT_ID, _key: 'loyal'}],
})

describe('useHasCardinalityOneReleaseVersions', () => {
  const mockDocumentId = 'test-document'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return false when no releases or document versions are available', () => {
    useActiveReleases.mockReturnValue({
      ...mockActiveReleasesReturn,
      data: [],
    })
    mockDocumentVersions([])

    const {result} = renderHook(() => useHasCardinalityOneReleaseVersions(mockDocumentId))

    expect(result.current).toBe(false)
  })

  it('should return false when document only has cardinality many releases', () => {
    useActiveReleases.mockReturnValue({
      ...mockActiveReleasesReturn,
      data: [activeASAPRelease], // This has cardinality 'many'
      byId: new Map([[activeASAPRelease._id, activeASAPRelease]]),
    })
    mockDocumentVersions([createStub('versions.rASAP.test-document', {bundleId: 'rASAP'})])

    const {result} = renderHook(() => useHasCardinalityOneReleaseVersions(mockDocumentId))

    expect(result.current).toBe(false)
  })

  it('should return true when document has versions in cardinality one releases', () => {
    useActiveReleases.mockReturnValue({
      ...mockActiveReleasesReturn,
      data: [cardinalityOneRelease],
      byId: new Map([[cardinalityOneRelease._id, cardinalityOneRelease]]),
    })
    mockDocumentVersions([baseScheduledVersion])

    const {result} = renderHook(() => useHasCardinalityOneReleaseVersions(mockDocumentId))

    expect(result.current).toBe(true)
  })

  it('should filter out non-version documents correctly', () => {
    useActiveReleases.mockReturnValue({
      ...mockActiveReleasesReturn,
      data: [cardinalityOneRelease],
      byId: new Map([[cardinalityOneRelease._id, cardinalityOneRelease]]),
    })
    mockDocumentVersions([
      baseScheduledVersion,
      createStub('drafts.test-document', {bundleId: 'drafts'}),
      createStub('test-document'),
    ])

    const {result} = renderHook(() => useHasCardinalityOneReleaseVersions(mockDocumentId))

    expect(result.current).toBe(true)
  })

  it('only counts the scheduled drafts of the selected variant', () => {
    useActiveReleases.mockReturnValue({
      ...mockActiveReleasesReturn,
      data: [cardinalityOneRelease],
      byId: new Map([[cardinalityOneRelease._id, cardinalityOneRelease]]),
    })
    mockDocumentVersions([variantScheduledVersion])

    const {result: baseResult} = renderHook(() =>
      useHasCardinalityOneReleaseVersions(mockDocumentId),
    )
    const {result: variantResult} = renderHook(() =>
      useHasCardinalityOneReleaseVersions(mockDocumentId, VARIANT_ID),
    )

    expect(baseResult.current).toBe(false)
    expect(variantResult.current).toBe(true)
  })

  it('does not count a scheduled draft of the base document for a variant', () => {
    useActiveReleases.mockReturnValue({
      ...mockActiveReleasesReturn,
      data: [cardinalityOneRelease],
      byId: new Map([[cardinalityOneRelease._id, cardinalityOneRelease]]),
    })
    mockDocumentVersions([baseScheduledVersion])

    const {result} = renderHook(() =>
      useHasCardinalityOneReleaseVersions(mockDocumentId, VARIANT_ID),
    )

    expect(result.current).toBe(false)
  })
})
