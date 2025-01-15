import {renderHook, waitFor} from '@testing-library/react'
import {delay, of} from 'rxjs'
import {describe, expect, it, type Mock, vi} from 'vitest'

import {type DocumentPreviewStore} from '../../../preview'
import {type DocumentIdSetObserverState} from '../../../preview/liveDocumentIdSet'
import {useDocumentPreviewStore} from '../../../store'
import {getPublishedId, type PublishedId} from '../../../util/draftUtils'
import {type ReleaseDocument, useArchivedReleases, useReleases} from '../../store'
import {RELEASE_DOCUMENTS_PATH} from '../../store/constants'
import {useDocumentVersions} from '../useDocumentVersions'

vi.mock('../../store', () => ({
  useReleasesMetadata: vi.fn(),
  useReleases: vi.fn(),
}))

vi.mock('../../../store', () => ({
  useDocumentPreviewStore: vi.fn(),
}))

vi.mock('../../../util/draftUtils', async (importOriginal) => ({
  ...(await importOriginal()),
  getPublishedId: vi.fn(),
}))

const mockReleases = [
  {
    _id: `${RELEASE_DOCUMENTS_PATH}.rSpring`,
    _type: 'system.release',
    _updatedAt: '2024-07-12T10:39:32Z',
    _createdAt: '2024-07-02T11:37:51Z',
    createdBy: 'pzAhBTkNX',
    state: 'active',
    metadata: {
      description: 'What a spring drop, allergies galore 🌸',
      title: 'Spring Drop',
      releaseType: 'asap',
    },
  },
  {
    _id: `${RELEASE_DOCUMENTS_PATH}.rWinter`,
    _type: 'system.release',
    _createdAt: '2024-07-02T11:37:51Z',
    _updatedAt: '2024-07-12T10:39:32Z',
    createdBy: 'pzAhBTkNX',
    state: 'active',
    metadata: {
      description: 'What a winter drop',
      title: 'Winter Drop',
      releaseType: 'asap',
    },
  },
] satisfies ReleaseDocument[]

async function setupMocks({
  releases,
  versionIds,
}: {
  releases: ReleaseDocument[]
  versionIds: string[]
}) {
  const mockUseReleases = useReleases as Mock<typeof useReleases>
  const mockUseArchivedReleases = useArchivedReleases as Mock<typeof useArchivedReleases>
  const mockDocumentPreviewStore = useDocumentPreviewStore as Mock<typeof useDocumentPreviewStore>
  const mockedGetPublishedId = getPublishedId as Mock<typeof getPublishedId>

  mockUseReleases.mockReturnValue({
    data: releases,
    releasesIds: releases.map((release) => release._id),
    loading: false,
    dispatch: vi.fn(),
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
    await setupMocks({releases: mockReleases, versionIds: []})

    const {result} = renderHook(() => useDocumentVersions({documentId: 'document-1'}))
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBe(null)
    expect(result.current.data).toEqual([])
  })

  it('should return an empty array if no versions are found', async () => {
    await setupMocks({releases: mockReleases, versionIds: []})
    const {result} = renderHook(() => useDocumentVersions({documentId: 'document-1'}))
    expect(result.current.data).toEqual([])
  })

  it('should return the releases if versions are found', async () => {
    await setupMocks({
      releases: [mockReleases[0]],
      versionIds: ['versions.rSpring.document-1'],
    })
    const {result} = renderHook(() => useDocumentVersions({documentId: 'document-1'}))
    await waitFor(() => {
      expect(result.current.data).toEqual([mockReleases[0]])
    })
  })
})
