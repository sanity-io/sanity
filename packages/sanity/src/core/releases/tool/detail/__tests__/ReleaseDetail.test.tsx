import {act, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {route, RouterProvider} from 'sanity/router'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {mockUseRouterReturn} from '../../../../../../test/mocks/useRouter.mock'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {
  activeASAPRelease,
  activeUndecidedErrorRelease,
  activeUndecidedRelease,
  publishedASAPRelease,
} from '../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {
  mockUseActiveReleases,
  useActiveReleasesMockReturn,
} from '../../../store/__tests__/__mocks/useActiveReleases.mock'
import {useReleaseOperationsMockReturn} from '../../../store/__tests__/__mocks/useReleaseOperations.mock'
import {
  mockUseReleasePermissions,
  useReleasePermissionsMockReturn,
} from '../../../store/__tests__/__mocks/useReleasePermissions.mock'
import {getReleaseIdFromReleaseDocumentId} from '../../../util/getReleaseIdFromReleaseDocumentId'
import {ReleaseDetail} from '../ReleaseDetail'
import {
  documentsInRelease,
  mockUseBundleDocuments,
  useBundleDocumentsMockReturn,
} from './__mocks__/useBundleDocuments.mock'
import {useReleaseEventsMockReturn} from './__mocks__/useReleaseEvents.mock'

vi.mock('sanity/router', async (importOriginal) => {
  return {
    ...(await importOriginal()),
    useRouter: vi.fn(() => mockUseRouterReturn),
    route: {
      create: vi.fn(),
    },
    IntentLink: vi.fn(),
  }
})

vi.mock('../../../store/useReleasePermissions', () => ({
  useReleasePermissions: vi.fn(() => useReleasePermissionsMockReturn),
}))

vi.mock('../../../store/useActiveReleases', () => ({
  useActiveReleases: vi.fn(() => useActiveReleasesMockReturn),
}))

vi.mock('../../../index', () => ({
  useReleaseOperations: vi.fn(() => useReleaseOperationsMockReturn),
  isReleaseScheduledOrScheduling: vi.fn(),
}))

vi.mock('../../../store/useReleaseOperations', () => ({
  useReleaseOperations: vi.fn(() => useReleaseOperationsMockReturn),
}))

vi.mock('../useBundleDocuments', () => ({
  useBundleDocuments: vi.fn(() => useBundleDocumentsMockReturn),
}))

vi.mock('../events/useReleaseEvents', () => ({
  useReleaseEvents: vi.fn(() => useReleaseEventsMockReturn),
}))

vi.mock('../ReleaseSummary', () => ({
  ReleaseSummary: () => <div data-testid="mocked-release-summary" />,
}))

vi.mock('../documentTable/useReleaseHistory', () => ({
  useReleaseHistory: vi.fn().mockReturnValue({
    documentsHistory: new Map(),
  }),
}))

const mockRouterNavigate = vi.fn()

const renderTest = async () => {
  const wrapper = await createTestProvider({
    resources: [releasesUsEnglishLocaleBundle],
  })
  return render(
    <RouterProvider
      state={{
        releaseId: activeASAPRelease._id,
      }}
      onNavigate={mockRouterNavigate}
      router={route.create('/', [route.create('/:releaseId')])}
    >
      <ReleaseDetail />
    </RouterProvider>,
    {wrapper},
  )
}

const publishAgnosticTests = (title: string) => {
  it('should allow for navigating back to releases overview', () => {
    screen.getByTestId('back-to-releases-button').click()
  })

  it('should show the release title', () => {
    screen.getAllByText(title)
  })
}

describe('ReleaseDetail', () => {
  describe('when loading releases', () => {
    beforeEach(async () => {
      vi.clearAllMocks()
      mockUseActiveReleases.mockClear()
      mockUseActiveReleases.mockReturnValue({
        ...useActiveReleasesMockReturn,
        loading: true,
      })

      mockUseReleasePermissions.mockReturnValue({
        checkWithPermissionGuard: async () => true,
      })

      await renderTest()
    })

    it('should show a loading spinner', () => {
      screen.getByTestId('loading-block')
    })

    it('does not show the rest of the screen ui', () => {
      expect(screen.queryByText('Publish all')).toBeNull()
      expect(screen.queryByText('Summary')).toBeNull()
      expect(screen.queryByText('Review changes')).toBeNull()
      expect(screen.queryByLabelText('Release menu')).toBeNull()
    })
  })

  describe('when loaded releases but still loading release documents', () => {
    beforeEach(async () => {
      vi.clearAllMocks()

      mockUseActiveReleases.mockClear()
      mockUseBundleDocuments.mockClear()

      mockUseBundleDocuments.mockReturnValue({...useBundleDocumentsMockReturn, loading: true})

      mockUseActiveReleases.mockReturnValue({
        ...useActiveReleasesMockReturn,
        data: [activeASAPRelease],
      })

      mockUseRouterReturn.state = {
        releaseId: getReleaseIdFromReleaseDocumentId(activeASAPRelease._id),
      }
      await renderTest()
    })

    it('should show loading spinner', () => {
      screen.getByTestId('loading-block')
    })

    it('should show the header', () => {
      screen.getByText(activeASAPRelease.metadata.title)
      screen.getByTestId('release-menu-button')
      expect(screen.getByTestId('publish-all-button').closest('button')).toBeDisabled()
    })
  })
})

describe('after releases have loaded', () => {
  describe('with unpublished release', () => {
    beforeEach(async () => {
      vi.clearAllMocks()
    })

    const loadedReleaseAndDocumentsTests = () => {
      it('should allow for the release to be archived', () => {
        fireEvent.click(screen.getByTestId('release-menu-button'))
        screen.getByTestId('archive-release-menu-item')
      })
    }

    describe('with pending document validation', () => {
      beforeEach(async () => {
        vi.clearAllMocks()

        mockUseBundleDocuments.mockReturnValue({
          loading: false,
          results: [
            {
              ...documentsInRelease,
              validation: {...documentsInRelease.validation, isValidating: true},
            },
          ],
        })
        await renderTest()
      })

      publishAgnosticTests(activeASAPRelease.metadata.title)
      loadedReleaseAndDocumentsTests()

      it('should disable publish all button', () => {
        act(() => {
          expect(screen.getByTestId('publish-all-button').closest('button')).toBeDisabled()
        })
      })
    })

    describe('with passing document validation', () => {
      beforeEach(async () => {
        mockUseBundleDocuments.mockReturnValue({
          loading: false,
          results: [documentsInRelease],
        })
        await renderTest()
      })

      publishAgnosticTests(activeASAPRelease.metadata.title)
      loadedReleaseAndDocumentsTests()

      it('should show publish all button when release not published', () => {
        expect(screen.getByTestId('publish-all-button').closest('button')).not.toBeDisabled()
      })

      it('should require confirmation to publish', () => {
        act(() => {
          expect(screen.getByTestId('publish-all-button')).toBeInTheDocument()
          fireEvent.click(screen.getByTestId('publish-all-button'))
          waitFor(() => {
            screen.getByText(
              'Are you sure you want to publish the release and all document versions?',
            )
          })
        })

        expect(screen.getByTestId('confirm-button')).not.toBeDisabled()
      })

      it('should perform publish', () => {
        act(() => {
          expect(screen.getByTestId('publish-all-button')).toBeInTheDocument()
          fireEvent.click(screen.getByTestId('publish-all-button'))
        })

        screen.getByText('Are you sure you want to publish the release and all document versions?')

        fireEvent.click(screen.getByTestId('confirm-button'))

        expect(useReleaseOperationsMockReturn.publishRelease).toHaveBeenCalledWith(
          activeASAPRelease._id,
          false,
        )
      })
    })

    describe('with failing document validation', () => {
      beforeEach(async () => {
        mockUseBundleDocuments.mockReturnValue({
          loading: false,
          results: [
            {
              ...documentsInRelease,
              validation: {
                hasError: true,
                isValidating: false,
                validation: [
                  {
                    message: 'title validation message',
                    level: 'error',
                    path: ['title'],
                  },
                ],
              },
            },
          ],
        })
        await renderTest()
      })

      publishAgnosticTests(activeASAPRelease.metadata.title)
      loadedReleaseAndDocumentsTests()

      it('should disable publish all button', () => {
        expect(screen.getByTestId('publish-all-button')).toBeDisabled()
        fireEvent.mouseOver(screen.getByTestId('publish-all-button'))
      })
    })
  })

  describe('with published release', () => {
    beforeEach(async () => {
      mockUseActiveReleases.mockReset()

      mockUseActiveReleases.mockReturnValue({
        ...useActiveReleasesMockReturn,
        data: [publishedASAPRelease],
      })

      mockUseRouterReturn.state = {
        releaseId: getReleaseIdFromReleaseDocumentId(publishedASAPRelease._id),
      }

      await renderTest()
    })

    publishAgnosticTests(publishedASAPRelease.metadata.title)

    it('should not show the publish button', () => {
      expect(screen.queryByText('Publish all')).toBeNull()
    })

    it('should not allow for the release to be unarchived', () => {
      fireEvent.click(screen.getByTestId('release-menu-button'))
      expect(screen.queryByTestId('unarchive-release-menu-item')).not.toBeInTheDocument()
    })

    it('should not allow for the release to be archived', () => {
      fireEvent.click(screen.getByTestId('release-menu-button'))
      expect(screen.queryByTestId('archive-release-menu-item')).not.toBeInTheDocument()
    })

    it('should not show the review changes button', () => {
      expect(screen.queryByText('Review changes')).toBeNull()
    })
  })

  describe('with missing release', () => {
    beforeEach(async () => {
      mockUseActiveReleases.mockReset()

      mockUseActiveReleases.mockReturnValue({
        ...useActiveReleasesMockReturn,
        data: [activeASAPRelease],
      })

      mockUseRouterReturn.state = {
        releaseId: getReleaseIdFromReleaseDocumentId(activeASAPRelease._id),
      }

      await renderTest()
    })

    it('should show missing release message', () => {
      screen.getByText(activeASAPRelease.metadata.title)
    })
  })

  describe('with release in error state', () => {
    beforeEach(async () => {
      mockUseActiveReleases.mockReset()

      mockUseActiveReleases.mockReturnValue({
        ...useActiveReleasesMockReturn,
        data: [activeUndecidedErrorRelease],
      })

      mockUseRouterReturn.state = {
        releaseId: getReleaseIdFromReleaseDocumentId(activeUndecidedErrorRelease._id),
      }

      await renderTest()
    })

    it('should show error message', () => {
      screen.getByTestId('release-error-details')
    })
  })

  describe('with release with permissions warnings', () => {
    beforeEach(async () => {
      mockUseActiveReleases.mockReset()

      mockUseActiveReleases.mockReturnValue({
        ...useActiveReleasesMockReturn,
        data: [activeUndecidedRelease],
      })

      mockUseRouterReturn.state = {
        releaseId: getReleaseIdFromReleaseDocumentId(activeUndecidedRelease._id),
      }

      mockUseReleasePermissions.mockReturnValue({
        checkWithPermissionGuard: async () => false,
      })

      await renderTest()
    })

    it('should show warning chip', () => {
      screen.getByTestId('release-permission-error-details')
    })
  })
})
