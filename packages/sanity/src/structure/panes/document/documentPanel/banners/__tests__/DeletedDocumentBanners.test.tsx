import {describe, expect, it, jest} from '@jest/globals'
import {render, screen} from '@testing-library/react'
import {type BundleDocument, LATEST} from 'sanity'
import {useDocumentPane} from 'sanity/structure'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {usePerspective} from '../../../../../../core/bundles/hooks/usePerspective'
import {useBundles} from '../../../../../../core/store/bundles/useBundles'
import {structureUsEnglishLocaleBundle} from '../../../../../i18n'
import {DeletedDocumentBanners} from '../DeletedDocumentBanners'

jest.mock('../../../useDocumentPane', () => ({
  useDocumentPane: jest.fn(),
}))

jest.mock('../../../../../../core/bundles/hooks/usePerspective', () => ({
  usePerspective: jest.fn(),
}))

jest.mock('../../../../../../core/store/bundles/useBundles', () => ({
  useBundles: jest.fn(),
}))

jest.mock('../../../../../../core/store/_legacy/history/useTimelineSelector', () => ({
  useTimelineSelector: jest.fn(),
}))

const mockUseDocumentPane = useDocumentPane as jest.Mock<typeof useDocumentPane>
const mockUseBundles = useBundles as jest.Mock<typeof useBundles>
const mockUsePerspective = usePerspective as jest.Mock<typeof usePerspective>

const renderTest = async () => {
  const wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})

  return render(<DeletedDocumentBanners />, {wrapper})
}

describe('DeletedDocumentBanners', () => {
  it('does not show either banner when document is not deleted', async () => {
    mockUsePerspective.mockReturnValue({currentGlobalBundle: {slug: 'test'}} as ReturnType<
      typeof usePerspective
    >)
    mockUseBundles.mockReturnValue({
      data: [],
      deletedBundles: {},
      dispatch: jest.fn(),
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
    const mockBundleDocument: BundleDocument = {slug: 'test'} as BundleDocument
    mockUsePerspective.mockReturnValue({currentGlobalBundle: mockBundleDocument} as ReturnType<
      typeof usePerspective
    >)
    mockUseBundles.mockReturnValue({
      data: [mockBundleDocument],
      deletedBundles: {test: mockBundleDocument},
      dispatch: jest.fn(),
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
    const mockBundleDocument: BundleDocument = {slug: 'test'} as BundleDocument

    mockUsePerspective.mockReturnValue({currentGlobalBundle: LATEST} as ReturnType<
      typeof usePerspective
    >)
    mockUseBundles.mockReturnValue({
      data: [mockBundleDocument],
      deletedBundles: {test: mockBundleDocument},
      dispatch: jest.fn(),
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
