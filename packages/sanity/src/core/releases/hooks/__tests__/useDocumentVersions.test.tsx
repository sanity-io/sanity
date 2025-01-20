import {renderHook, waitFor} from '@testing-library/react'
import {delay, of} from 'rxjs'
import {describe, expect, it, type Mock, vi} from 'vitest'

import {type DocumentPreviewStore} from '../../../preview'
import {type DocumentIdSetObserverState} from '../../../preview/liveDocumentIdSet'
import {useDocumentPreviewStore} from '../../../store'
import {getPublishedId, type PublishedId} from '../../../util/draftUtils'
import {activeASAPRelease, activeScheduledRelease} from '../../__fixtures__/release.fixture'
import {type ReleaseDocument, useActiveReleases} from '../../store'
import {useReleasesIds} from '../../store/useReleasesIds'
import {useDocumentVersions} from '../useDocumentVersions'

vi.mock('../../store', () => ({
  useReleasesMetadata: vi.fn(),
  useActiveReleases: vi.fn(),
}))

vi.mock('../../store/useReleasesIds', () => ({
  useReleasesIds: vi.fn(),
}))

vi.mock('../../../store', () => ({
  useDocumentPreviewStore: vi.fn(),
}))

vi.mock('../../../util/draftUtils', async (importOriginal) => ({
  ...(await importOriginal()),
  getPublishedId: vi.fn(),
}))

async function setupMocks({
  releases,
  versionIds,
}: {
  releases: ReleaseDocument[]
  versionIds: string[]
}) {
  const mockUseActiveReleases = useActiveReleases as Mock<typeof useActiveReleases>
  const mockUseReleasesIds = useReleasesIds as Mock<typeof useReleasesIds>
  const mockDocumentPreviewStore = useDocumentPreviewStore as Mock<typeof useDocumentPreviewStore>
  const mockedGetPublishedId = getPublishedId as Mock<typeof getPublishedId>

  mockUseActiveReleases.mockReturnValue({
    data: releases,
    loading: false,
    dispatch: vi.fn(),
  })

  mockUseReleasesIds.mockReturnValue({
    releasesIds: [],
  })

  mockedGetPublishedId.mockReturnValue('document-1' as PublishedId)

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
      expect(result.current.data).toEqual([activeASAPRelease])
    })
  })
})
