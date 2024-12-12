import {act, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {route, RouterProvider} from 'sanity/router'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {mockUseRouterReturn} from '../../../../../../test/mocks/useRouter.mock'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {activeASAPRelease, publishedASAPRelease} from '../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {useReleaseOperationsMockReturn} from '../../../store/__tests__/__mocks/useReleaseOperations.mock'
import {
  mockUseReleases,
  useReleasesMockReturn,
} from '../../../store/__tests__/__mocks/useReleases.mock'
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

vi.mock('../../../store/useReleases', () => ({
  useReleases: vi.fn(() => useReleasesMockReturn),
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

vi.mock('../../components/ReleasePublishAllButton/useObserveDocumentRevisions', () => ({
  useObserveDocumentRevisions: vi.fn().mockReturnValue({
    '123': 'mock revision id',
  }),
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
      mockUseReleases.mockClear()
      mockUseReleases.mockReturnValue({
        ...useReleasesMockReturn,
        loading: true,
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

      mockUseReleases.mockClear()
      mockUseBundleDocuments.mockClear()

      mockUseBundleDocuments.mockReturnValue({...useBundleDocumentsMockReturn, loading: true})

      mockUseReleases.mockReturnValue({
        ...useReleasesMockReturn,
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
    const currentDate = new Date().toISOString()
    beforeEach(async () => {
      vi.clearAllMocks()
    })

    const loadedReleaseAndDocumentsTests = () => {
      it('should allow for the release to be archived', () => {
        fireEvent.click(screen.getByTestId('release-menu-button'))
        screen.getByTestId('archive-release-menu-item')
      })

      // eslint-disable-next-line no-warning-comments
      // TODO: unsure if this will work this way in the future
      /*it('should navigate to release review changes screen', () => {
        expect(screen.getByTestId('review-button').closest('button')).not.toBeDisabled()
        fireEvent.click(screen.getByTestId('review-button'))
        expect(mockRouterNavigate).toHaveBeenCalledWith({
          path: '/test-release-id?screen=review',
        })
      })*/
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
      mockUseReleases.mockReset()

      mockUseReleases.mockReturnValue({
        ...useReleasesMockReturn,
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
      mockUseReleases.mockReset()

      mockUseReleases.mockReturnValue({
        ...useReleasesMockReturn,
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
})
