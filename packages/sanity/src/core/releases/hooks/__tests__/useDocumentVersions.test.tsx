import {type ReleaseDocument} from '@sanity/client'
import {getPublishedId} from '@sanity/client/csm'
import {type DocumentSystem} from '@sanity/types'
import {renderHook, waitFor} from '@testing-library/react'
import {delay, of} from 'rxjs'
import {describe, expect, it, type Mock, vi} from 'vitest'

import {type DocumentPreviewStore} from '../../../preview'
import {useDocumentPreviewStore} from '../../../store'
import {activeASAPRelease, activeScheduledRelease} from '../../__fixtures__/release.fixture'
import {useActiveReleasesMockReturn} from '../../store/__tests__/__mocks/useActiveReleases.mock'
import {
  type DocumentPerspectiveState,
  getOrCreateDocumentVersionsObservable,
  useDocumentVersions,
} from '../useDocumentVersions'

vi.mock('../../../hooks/useDataset', () => ({
  useDataset: vi.fn().mockReturnValue('test'),
}))

vi.mock('../../../hooks/useProjectId', () => ({
  useProjectId: vi.fn().mockReturnValue('test-project'),
}))

vi.mock('../useDocumentVersions', async () => {
  const actual = await vi.importActual('../useDocumentVersions')
  return {
    ...actual,
    getOrCreateDocumentVersionsObservable: vi.fn(),
  }
})

vi.mock('../../../store', () => ({
  useDocumentPreviewStore: vi.fn(),
}))

vi.mock('../../store/useActiveReleases', () => ({
  useActiveReleases: vi.fn(() => useActiveReleasesMockReturn),
}))

async function setupMocks({
  releases,
  versionIds,
  observeSystem = true,
}: {
  releases: ReleaseDocument[]
  versionIds: string[]
  /**
   * When `false`, versions are returned without `_system`, so the hook
   * falls back to `temporarilyBuildDocumentSystem`.
   */
  observeSystem?: boolean
}) {
  const mockDocumentPreviewStore = useDocumentPreviewStore as Mock<typeof useDocumentPreviewStore>
  const mockGetOrCreateDocumentVersionsObservable = getOrCreateDocumentVersionsObservable as Mock<
    typeof getOrCreateDocumentVersionsObservable
  >

  mockDocumentPreviewStore.mockReturnValue({
    unstable_observeDocumentSet: vi.fn().mockImplementation(() =>
      of({
        status: 'connected',
        documents: versionIds.map((id) => ({
          _id: id,
          _rev: '',
          _createdAt: '',
          _updatedAt: '',
          _system: observeSystem
            ? ({
                bundleId: 'drafts',
                release: null,
                variant: null,
                group: {_ref: getPublishedId(id), _weak: true},
                scopeId: getPublishedId(id),
              } satisfies DocumentSystem)
            : undefined,
        })),
      }).pipe(
        // simulate async initial emission
        delay(0),
      ),
    ),
  } as unknown as DocumentPreviewStore)

  const {useActiveReleases} = await import('../../store/useActiveReleases')
  vi.mocked(useActiveReleases).mockReturnValue({
    ...useActiveReleasesMockReturn,
    data: releases,
  })

  mockGetOrCreateDocumentVersionsObservable.mockImplementation(() =>
    of({
      data: versionIds,
      versions: versionIds.map((id) => ({
        _id: id,
        _rev: '',
        _createdAt: '',
        _updatedAt: '',
        _system: observeSystem
          ? ({
              bundleId: 'drafts',
              release: null,
              variant: null,
              group: {_ref: getPublishedId(id), _weak: true},
              scopeId: getPublishedId(id),
            } satisfies DocumentSystem)
          : undefined,
      })),
      loading: false,
      error: null,
    } as DocumentPerspectiveState).pipe(delay(0)),
  )
}

describe('useDocumentVersions', () => {
  it('should return initial state', async () => {
    await setupMocks({releases: [activeASAPRelease, activeScheduledRelease], versionIds: []})

    const {result} = renderHook(() => useDocumentVersions({documentId: 'document-1'}))
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBe(null)
    expect(result.current.data).toEqual([])
  })

  it('should return an empty array if no versions are found', async () => {
    await setupMocks({releases: [activeASAPRelease, activeScheduledRelease], versionIds: []})
    const {result} = renderHook(() => useDocumentVersions({documentId: 'document-1'}))
    expect(result.current.data).toEqual([])
  })

  it('should return the releases if versions are found', async () => {
    await setupMocks({
      releases: [activeASAPRelease],
      versionIds: ['versions.rASAP.document-1'],
    })
    const {result} = renderHook(() => useDocumentVersions({documentId: 'document-1'}))
    await waitFor(() => {
      expect(result.current.data).toEqual(['versions.rASAP.document-1'])
    })
    expect(result.current.versions).toEqual([
      {
        _id: 'versions.rASAP.document-1',
        _rev: '',
        _createdAt: '',
        _updatedAt: '',
        _system: {
          bundleId: 'drafts',
          release: null,
          variant: null,
          group: {_ref: 'document-1', _weak: true},
          scopeId: 'document-1',
        },
      },
    ])
  })

  it('should fall back to a temporarily built system when the document has no system', async () => {
    await setupMocks({
      releases: [activeASAPRelease],
      versionIds: ['versions.rASAP.document-1'],
      observeSystem: false,
    })
    const {result} = renderHook(() => useDocumentVersions({documentId: 'document-1'}))
    await waitFor(() => {
      expect(result.current.data).toEqual(['versions.rASAP.document-1'])
    })
    expect(result.current.versions).toEqual([
      {
        _id: 'versions.rASAP.document-1',
        _rev: '',
        _createdAt: '',
        _updatedAt: '',
        _system: {
          bundleId: 'rASAP',
          release: {_ref: '_.releases.rASAP', _weak: true},
          variant: null,
          group: {_ref: 'document-1', _weak: true},
          scopeId: 'rASAP',
        },
      },
    ])
  })

  it('should build a drafts system when a draft document has no system', async () => {
    await setupMocks({
      releases: [activeASAPRelease],
      versionIds: ['drafts.document-1'],
      observeSystem: false,
    })
    const {result} = renderHook(() => useDocumentVersions({documentId: 'document-1'}))
    await waitFor(() => {
      expect(result.current.data).toEqual(['drafts.document-1'])
    })
    expect(result.current.versions).toEqual([
      {
        _id: 'drafts.document-1',
        _rev: '',
        _createdAt: '',
        _updatedAt: '',
        _system: {
          bundleId: 'drafts',
          release: null,
          variant: null,
          group: {_ref: 'document-1', _weak: true},
          scopeId: null,
        },
      },
    ])
  })
})
