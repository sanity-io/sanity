import {renderHook} from '@testing-library/react'
import {of} from 'rxjs'
import {describe, expect, it, type Mock, vi} from 'vitest'

import {type DocumentPreviewStore} from '../../../preview'
import {type ReleaseDocument} from '../../../store'
import {type PublishedId} from '../../../util/draftUtils'
import {useDocumentVersions} from '../useDocumentVersions'

// Mock the entire module
vi.mock('../../../studio/source')

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  useClient: vi.fn(),
  useReleases: vi.fn(() => ({data: {}})),
  getPublishedId: vi.fn(),
  useDocumentPreviewStore: vi.fn(),
}))

const mockBundles = [
  {
    description: 'What a spring drop, allergies galore 🌸',
    _id: 'spring-drop',
    _type: 'release',
    _updatedAt: '2024-07-12T10:39:32Z',
    _rev: 'HdJONGqRccLIid3oECLjYZ',
    authorId: 'pzAhBTkNX',
    title: 'Spring Drop',
    icon: 'heart-filled',
    hue: 'magenta',
    _createdAt: '2024-07-02T11:37:51Z',
    releaseType: 'asap',
  },
  {
    _id: 'winter-drop',
    _type: 'release',
    description: 'What a winter drop',
    _updatedAt: '2024-07-12T10:39:32Z',
    _rev: 'HdJONGqRccLIid3oECLjYZ',
    authorId: 'pzAhBTkNX',
    title: 'Winter Drop',
    icon: 'heart-filled',

    hue: 'purple',
    _createdAt: '2024-07-02T11:37:51Z',
    releaseType: 'asap',
  },
] satisfies ReleaseDocument[]

async function setupMocks({
  bundles,
  versionIds,
}: {
  bundles: ReleaseDocument[]
  versionIds: string[]
}) {
  const sanityModule = await import('sanity')

  const useReleases = sanityModule.useReleases as Mock<typeof sanityModule.useReleases>
  const useDocumentPreviewStore = sanityModule.useDocumentPreviewStore as Mock<
    typeof sanityModule.useDocumentPreviewStore
  >
  const getPublishedId = sanityModule.getPublishedId as Mock<typeof sanityModule.getPublishedId>

  useReleases.mockReturnValue({
    data: bundles,
    loading: false,
    dispatch: vi.fn(),
    deletedReleases: {},
  })

  getPublishedId.mockReturnValue('document-1' as PublishedId)

  useDocumentPreviewStore.mockReturnValue({
    unstable_observeDocumentIdSet: vi
      .fn<DocumentPreviewStore['unstable_observeDocumentIdSet']>()
      .mockReturnValue(of({status: 'connected', documentIds: versionIds})),
  } as unknown as DocumentPreviewStore)
}

describe('useDocumentVersions', () => {
  it('should return initial state', async () => {
    await setupMocks({bundles: mockBundles, versionIds: []})
    const {result} = renderHook(() => useDocumentVersions({documentId: 'document-1'}))
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBe(null)
    expect(result.current.data).toEqual([])
  })

  it('should return an empty array if no versions are found', async () => {
    await setupMocks({bundles: mockBundles, versionIds: []})
    const {result} = renderHook(() => useDocumentVersions({documentId: 'document-1'}))
    expect(result.current.data).toEqual([])
  })

  it('should return the bundles if versions are found', async () => {
    await setupMocks({
      bundles: [mockBundles[0]],
      versionIds: ['versions.spring-drop.document-1'],
    })
    const {result} = renderHook(() => useDocumentVersions({documentId: 'document-1'}))
    expect(result.current.data).toEqual([mockBundles[0]])
  })
})
