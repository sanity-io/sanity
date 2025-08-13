import {type ReleaseDocument} from '@sanity/client'
import {renderHook, waitFor} from '@testing-library/react'
import {delay, of} from 'rxjs'
import {describe, expect, it, type Mock, vi} from 'vitest'

import {type DocumentPreviewStore} from '../../../preview'
import {type DocumentIdSetObserverState} from '../../../preview/liveDocumentIdSet'
import {useDocumentPreviewStore} from '../../../store/_legacy/datastores'
import {activeASAPRelease, activeScheduledRelease} from '../../__fixtures__/release.fixture'
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

async function setupMocks({versionIds}: {releases: ReleaseDocument[]; versionIds: string[]}) {
  const mockDocumentPreviewStore = useDocumentPreviewStore as Mock<typeof useDocumentPreviewStore>
  const mockGetOrCreateDocumentVersionsObservable = getOrCreateDocumentVersionsObservable as Mock<
    typeof getOrCreateDocumentVersionsObservable
  >

  mockDocumentPreviewStore.mockReturnValue({
    unstable_observeDocumentIdSet: vi
      .fn<DocumentPreviewStore['unstable_observeDocumentIdSet']>()
      .mockImplementation(() =>
        of({status: 'connected', documentIds: versionIds} as DocumentIdSetObserverState).pipe(
          // simulate async initial emission
          delay(0),
        ),
      ),
  } as unknown as DocumentPreviewStore)

  mockGetOrCreateDocumentVersionsObservable.mockImplementation(() =>
    of({
      data: versionIds,
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
  })
})
