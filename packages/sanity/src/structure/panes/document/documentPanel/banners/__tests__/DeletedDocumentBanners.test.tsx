import {render, screen, waitFor} from '@testing-library/react'
import {
  type DocumentActionComponent,
  type DocumentActionsResolver,
  LATEST,
  PUBLISHED,
  type ReleaseDocument,
  useActiveReleases,
  usePerspective,
  useReleasesIds,
} from 'sanity'
import {describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../../../i18n'
import {useDocumentPane} from '../../../useDocumentPane'
import {DeletedDocumentBanners} from '../DeletedDocumentBanners'

vi.mock('../../../useDocumentPane', () => ({
  useDocumentPane: vi.fn(),
}))

vi.mock('sanity', async () => {
  const sanity = await vi.importActual('sanity')
  return {
    ...sanity,
    useReleasesIds: vi.fn(),
    useActiveReleases: vi.fn(),
    usePerspective: vi.fn(),
    useArchivedReleases: vi.fn(),
  }
})

const mockUseDocumentPane = useDocumentPane as Mock<typeof useDocumentPane>
const mockUseReleasesIds = useReleasesIds as Mock<typeof useReleasesIds>
const mockUseActiveReleases = useActiveReleases as Mock<typeof useActiveReleases>
const mockUsePerspective = usePerspective as Mock<typeof usePerspective>

const restoreAction: DocumentActionComponent = Object.assign(() => null, {
  action: 'restore' as const,
})

const renderTest = async (documentActions?: DocumentActionsResolver) => {
  const wrapper = await createTestProvider({
    resources: [structureUsEnglishLocaleBundle],
    config: documentActions ? {document: {actions: documentActions}} : undefined,
  })

  return render(<DeletedDocumentBanners />, {wrapper})
}

const mockDraftPerspective = () => {
  mockUsePerspective.mockReturnValue({
    selectedPerspective: LATEST,
  } as unknown as ReturnType<typeof usePerspective>)
  mockUseActiveReleases.mockReturnValue({
    data: [],
    dispatch: vi.fn(),
    loading: false,
  })
  mockUseReleasesIds.mockReturnValue({
    releasesIds: [],
  })
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
      ready: true,
      documentId: 'test',
      documentType: 'author',
    } as ReturnType<typeof useDocumentPane>)

    await renderTest()
    expect(screen.queryByTestId('deleted-document-banner')).toBeNull()
    expect(screen.queryByTestId('deleted-release-banner')).toBeNull()
  })

  it('prefers to show release deleted banner when document was in a release', async () => {
    const mockReleaseDocument = {
      _id: '_.releases.rtest',
      _type: 'system.release',
      state: 'archived',
    } as ReleaseDocument
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
      documentId: 'foo',
      documentType: 'author',
      isDeleted: true,
      isDeleting: false,
      ready: true,
    } as ReturnType<typeof useDocumentPane>)

    await renderTest()

    expect(screen.queryByTestId('deleted-document-banner')).toBeNull()
    expect(screen.getByTestId('deleted-release-banner')).toBeInTheDocument()
  })

  it('shows the fallback document deleted banner when document was not in a release', async () => {
    mockDraftPerspective()
    mockUseDocumentPane.mockReturnValue({
      isDeleted: true,
      isDeleting: false,
      ready: true,
      documentId: 'test-document',
      documentType: 'author',
    } as ReturnType<typeof useDocumentPane>)

    await renderTest()

    await waitFor(() => {
      expect(screen.getByTestId('deleted-document-banner')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('deleted-release-banner')).toBeNull()
    expect(screen.getByText('This document has been deleted.')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', {name: 'Restore most recent revision'}),
    ).not.toBeInTheDocument()
  })

  it('shows restore when a restore stub is injected', async () => {
    mockDraftPerspective()
    mockUseDocumentPane.mockReturnValue({
      isDeleted: true,
      isDeleting: false,
      ready: true,
      documentId: 'test-document',
      documentType: 'author',
    } as ReturnType<typeof useDocumentPane>)

    await renderTest((prev) => [...prev, restoreAction])

    expect(screen.getByRole('button', {name: 'Restore most recent revision'})).toBeInTheDocument()
  })

  it('shows restore from the published perspective when restore is configured', async () => {
    mockUsePerspective.mockReturnValue({
      selectedPerspective: PUBLISHED,
    } as unknown as ReturnType<typeof usePerspective>)
    mockUseActiveReleases.mockReturnValue({
      data: [],
      dispatch: vi.fn(),
      loading: false,
    })
    mockUseReleasesIds.mockReturnValue({
      releasesIds: [],
    })
    mockUseDocumentPane.mockReturnValue({
      isDeleted: true,
      isDeleting: false,
      ready: true,
      documentId: 'test-document',
      documentType: 'author',
    } as ReturnType<typeof useDocumentPane>)

    await renderTest((prev) => [...prev, restoreAction])

    expect(screen.getByRole('button', {name: 'Restore most recent revision'})).toBeInTheDocument()
  })

  it('leaves the archived release banner ungated when document.actions is empty', async () => {
    const mockReleaseDocument = {
      _id: '_.releases.rtest',
      _type: 'system.release',
      state: 'archived',
    } as ReleaseDocument
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
      documentId: 'foo',
      documentType: 'author',
      isDeleted: true,
      isDeleting: false,
      ready: true,
    } as ReturnType<typeof useDocumentPane>)

    await renderTest(() => [])

    expect(screen.getByTestId('deleted-release-banner')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', {name: 'Restore most recent revision'}),
    ).not.toBeInTheDocument()
  })
})
