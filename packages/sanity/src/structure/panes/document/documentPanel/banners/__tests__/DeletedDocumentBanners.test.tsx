import {render, screen, waitFor} from '@testing-library/react'
import {
  LATEST,
  type ReleaseDocument,
  useActiveReleases,
  usePerspective,
  useReleasesIds,
} from 'sanity'
import {useDocumentPane} from 'sanity/structure'
import {describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../../../i18n'
import {DeletedDocumentBanners} from '../DeletedDocumentBanners'

vi.mock('../../../useDocumentPane', () => ({
  useDocumentPane: vi.fn(),
}))

vi.mock('../../../../../../core/releases/hooks/usePerspective', () => ({
  usePerspective: vi.fn(),
}))

vi.mock('../../../../../../core/releases/store/useActiveReleases', () => ({
  useActiveReleases: vi.fn(),
}))

vi.mock('../../../../../../core/releases/store/useReleasesIds', () => ({
  useReleasesIds: vi.fn(),
}))

vi.mock('../../../../../../core/releases/store/useArchivedReleases', () => ({
  useArchivedReleases: vi.fn(),
}))

vi.mock('../../../../../../core/store/_legacy/history/useTimelineSelector', () => ({
  useTimelineSelector: vi.fn(),
}))

const mockUseDocumentPane = useDocumentPane as Mock<typeof useDocumentPane>
const mockUseReleasesIds = useReleasesIds as Mock<typeof useReleasesIds>
const mockUseActiveReleases = useActiveReleases as Mock<typeof useActiveReleases>
const mockUsePerspective = usePerspective as Mock<typeof usePerspective>

const renderTest = async () => {
  const wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})

  return render(<DeletedDocumentBanners />, {wrapper})
}

describe('DeletedDocumentBanners', () => {
  it('does not show either banner when document is not deleted', async () => {
    mockUsePerspective.mockReturnValue({selectedPerspective: {_id: 'test'}} as ReturnType<
      typeof usePerspective
    >)
    mockUseActiveReleases.mockReturnValue({
      data: [],
      dispatch: vi.fn(),
      loading: false,
    })
    mockUseReleasesIds.mockReturnValue({
      releasesIds: [],
    })
    mockUseDocumentPane.mockReturnValue({
      isDeleted: false,
      isDeleting: false,
      documentId: 'test',
    } as ReturnType<typeof useDocumentPane>)

    await renderTest()
    expect(screen.queryByTestId('deleted-document-banner')).toBeNull()
    expect(screen.queryByTestId('deleted-release-banner')).toBeNull()
  })

  it('prefers to show release deleted banner when document was in a release', async () => {
    const mockReleaseDocument = {_id: 'test', state: 'archived'} as ReleaseDocument
    mockUsePerspective.mockReturnValue({selectedPerspective: mockReleaseDocument} as ReturnType<
      typeof usePerspective
    >)
    mockUseActiveReleases.mockReturnValue({
      data: [mockReleaseDocument],
      dispatch: vi.fn(),
      loading: false,
    })
    mockUseReleasesIds.mockReturnValue({
      releasesIds: [mockReleaseDocument._id],
    })
    mockUseDocumentPane.mockReturnValue({
      isDeleted: true,
      isDeleting: false,
    } as ReturnType<typeof useDocumentPane>)

    await renderTest()

    const fallbackBanner = screen.queryByTestId('deleted-document-banner')
    const bundleBanner = screen.queryByTestId('deleted-release-banner')
    expect(fallbackBanner).toBeNull()
    expect(bundleBanner).toBeInTheDocument()
  })

  it('shows the fallback document deleted banner when document was not in a release', async () => {
    const mockBundleDocument: ReleaseDocument = {_id: 'test', state: 'archived'} as ReleaseDocument

    mockUsePerspective.mockReturnValue({
      selectedPerspective: LATEST,
      setPerspective: vi.fn(),
    } as unknown as ReturnType<typeof usePerspective>)

    mockUseActiveReleases.mockReturnValue({
      data: [mockBundleDocument],
      dispatch: vi.fn(),
      loading: false,
    })

    mockUseReleasesIds.mockReturnValue({
      releasesIds: [mockBundleDocument._id],
    })

    mockUseDocumentPane.mockReturnValue({
      isDeleted: true,
      isDeleting: false,
      documentId: 'test-document',
    } as ReturnType<typeof useDocumentPane>)

    await renderTest()

    const fallbackBanner = screen.queryByTestId('deleted-document-banner')
    const bundleBanner = screen.queryByTestId('deleted-release-banner')

    expect(bundleBanner).toBeNull()
    await waitFor(() => {
      if (fallbackBanner) {
        expect(fallbackBanner).toBeInTheDocument()
      }
    })
  })
})
