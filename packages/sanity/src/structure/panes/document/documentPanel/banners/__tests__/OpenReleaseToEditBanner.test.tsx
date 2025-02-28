import {cleanup, render, screen} from '@testing-library/react'
import {
  getReleaseIdFromReleaseDocumentId,
  type ReleaseDocument,
  useActiveReleases,
  useDocumentVersionSortedList,
} from 'sanity'
import {afterEach, beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../../../i18n'
import {OpenReleaseToEditBanner} from '../OpenReleaseToEditBanner'

vi.mock('../../../useDocumentPane', () => ({
  useDocumentPane: vi.fn(),
}))

vi.mock('sanity', async () => {
  const sanity = await vi.importActual('sanity')
  return {
    ...sanity,
    useReleasesIds: vi.fn(),
    useActiveReleases: vi.fn(),
    useArchivedReleases: vi.fn(),
    useDocumentVersionSortedList: vi.fn(),
  }
})

const mockUseActiveReleases = useActiveReleases as Mock<typeof useActiveReleases>
const mockUseDocumentVersionSortedList = useDocumentVersionSortedList as Mock<
  typeof useDocumentVersionSortedList
>

const release1: ReleaseDocument = {
  _rev: 'activeRev',
  _id: '_.releases.rActive',
  _type: 'system.release',
  _createdAt: '2023-10-10T08:00:00Z',
  _updatedAt: '2023-10-10T09:00:00Z',
  state: 'active',
  metadata: {
    title: 'active Release',
    releaseType: 'scheduled',
    intendedPublishAt: '2023-10-10T10:00:00.000Z',
    description: 'active Release description',
  },
}

const release2: ReleaseDocument = {
  _rev: 'activeRev',
  _id: '_.releases.rActive2',
  _type: 'system.release',
  _createdAt: '2023-10-10T08:00:00Z',
  _updatedAt: '2023-10-10T09:00:00Z',
  state: 'active',
  metadata: {
    title: 'active Release 2 electric boogaloo',
    releaseType: 'scheduled',
    intendedPublishAt: '2023-10-10T10:00:00.000Z',
    description: 'active Release description',
  },
}

describe('OpenReleaseToEditbanner', () => {
  beforeEach(() => {
    mockUseActiveReleases.mockClear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('does not show when is draft', async () => {
    mockUseActiveReleases.mockReturnValue({
      data: [],
      dispatch: vi.fn(),
      loading: false,
    })
    mockUseDocumentVersionSortedList.mockReturnValue({
      sortedDocumentList: [],
      onlyHasVersions: false,
    })

    const wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})

    render(<OpenReleaseToEditBanner documentId={'drafts.test'} isPinnedDraftOrPublished />, {
      wrapper,
    })

    expect(screen.queryByTestId('open-release-to-edit-banner')).toBeNull()
  })

  it('does not show when is published', async () => {
    mockUseActiveReleases.mockReturnValue({
      data: [],
      dispatch: vi.fn(),
      loading: false,
    })
    mockUseDocumentVersionSortedList.mockReturnValue({
      sortedDocumentList: [],
      onlyHasVersions: false,
    })

    const wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})
    render(<OpenReleaseToEditBanner documentId={'test'} isPinnedDraftOrPublished />, {
      wrapper,
    })

    expect(screen.queryByTestId('open-release-to-edit-banner')).toBeNull()
  })

  // @jordan, here's the trouble child (the latest)
  it('does not show if it only has versions, no draft or publish but is showing a version', async () => {
    const testId = `versions.${getReleaseIdFromReleaseDocumentId(release1._id)}.test`

    mockUseActiveReleases.mockReturnValue({
      data: [release1],
      dispatch: vi.fn(),
      loading: false,
    })
    mockUseDocumentVersionSortedList.mockReturnValue({
      sortedDocumentList: [release1],
      onlyHasVersions: true,
    })

    const wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})
    render(<OpenReleaseToEditBanner documentId={testId} isPinnedDraftOrPublished={false} />, {
      wrapper,
    })

    expect(screen.queryByTestId('open-release-to-edit-banner')).toBeNull()
  })

  it('shows the banner because it is not a draft or publish and its showing version that is not the pinned one', async () => {
    const testId2 = `versions.${getReleaseIdFromReleaseDocumentId(release2._id)}.test`

    mockUseActiveReleases.mockReturnValue({
      data: [release1, release2],
      loading: false,
      dispatch: vi.fn(),
    })

    mockUseDocumentVersionSortedList.mockReturnValue({
      sortedDocumentList: [release1, release2],
      onlyHasVersions: true,
    })

    const wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})
    render(<OpenReleaseToEditBanner documentId={testId2} isPinnedDraftOrPublished />, {
      wrapper,
    })

    expect(screen.queryByTestId('open-release-to-edit-banner')).not.toBeNull()
  })
})
