import {render, screen} from '@testing-library/react'
import {type BundleDocument, LATEST, useBundles, usePerspective} from 'sanity'
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

vi.mock('../../../../../../core/store/bundles/useBundles', () => ({
  useBundles: vi.fn(),
}))

vi.mock('../../../../../../core/store/_legacy/history/useTimelineSelector', () => ({
  useTimelineSelector: vi.fn(),
}))

const mockUseDocumentPane = useDocumentPane as Mock<typeof useDocumentPane>
const mockUseBundles = useBundles as Mock<typeof useBundles>
const mockUsePerspective = usePerspective as Mock<typeof usePerspective>

const renderTest = async () => {
  const wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})

  return render(<DeletedDocumentBanners />, {wrapper})
}

describe('DeletedDocumentBanners', () => {
  it('does not show either banner when document is not deleted', async () => {
    mockUsePerspective.mockReturnValue({currentGlobalBundle: {_id: 'test'}} as ReturnType<
      typeof usePerspective
    >)
    mockUseBundles.mockReturnValue({
      data: [],
      deletedBundles: {},
      dispatch: vi.fn(),
      loading: false,
    })
    mockUseDocumentPane.mockReturnValue({
      isDeleted: false,
      isDeleting: false,
      documentId: 'test',
    } as ReturnType<typeof useDocumentPane>)

    await renderTest()
    expect(screen.queryByTestId('deleted-document-banner')).toBeNull()
    expect(screen.queryByTestId('deleted-bundle-banner')).toBeNull()
  })

  it('prefers to show bundle deleted banner when document was in a bundle', async () => {
    const mockBundleDocument = {_id: 'test'} as BundleDocument
    mockUsePerspective.mockReturnValue({currentGlobalBundle: mockBundleDocument} as ReturnType<
      typeof usePerspective
    >)
    mockUseBundles.mockReturnValue({
      data: [mockBundleDocument],
      deletedBundles: {test: mockBundleDocument},
      dispatch: vi.fn(),
      loading: false,
    })
    mockUseDocumentPane.mockReturnValue({
      isDeleted: true,
      isDeleting: false,
    } as ReturnType<typeof useDocumentPane>)

    await renderTest()

    const fallbackBanner = screen.queryByTestId('deleted-document-banner')
    const bundleBanner = screen.queryByTestId('deleted-bundle-banner')
    expect(fallbackBanner).toBeNull()
    expect(bundleBanner).toBeInTheDocument()
  })

  it('shows the fallback document deleted banner when document was not in a bundle', async () => {
    const mockBundleDocument: BundleDocument = {_id: 'test'} as BundleDocument

    mockUsePerspective.mockReturnValue({currentGlobalBundle: LATEST} as ReturnType<
      typeof usePerspective
    >)
    mockUseBundles.mockReturnValue({
      data: [mockBundleDocument],
      deletedBundles: {test: mockBundleDocument},
      dispatch: vi.fn(),
      loading: false,
    })
    mockUseDocumentPane.mockReturnValue({
      isDeleted: true,
      isDeleting: false,
      documentId: 'versions.test-version.test-document',
    } as ReturnType<typeof useDocumentPane>)

    await renderTest()

    const fallbackBanner = screen.queryByTestId('deleted-document-banner')
    const bundleBanner = screen.queryByTestId('deleted-bundle-banner')

    expect(bundleBanner).toBeNull()
    expect(fallbackBanner).toBeInTheDocument()
  })
})
