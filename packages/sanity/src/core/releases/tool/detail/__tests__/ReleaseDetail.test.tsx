import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react'
import {route, RouterProvider} from 'sanity/router'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {useBundles} from '../../../../store/bundles'
import {useBundleOperations} from '../../../../store/bundles/useBundleOperations'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {ReleaseDetail} from '../ReleaseDetail'
import {useBundleDocuments} from '../useBundleDocuments'

jest.mock('../../../../store/bundles', () => ({
  useBundles: jest.fn().mockReturnValue({data: [], loading: false, deletedBundles: {}}),
}))

jest.mock('../../../../store/bundles/useBundleOperations', () => ({
  useBundleOperations: jest.fn().mockReturnValue({
    publishBundle: jest.fn(),
  }),
}))

jest.mock('../useBundleDocuments', () => ({
  useBundleDocuments: jest
    .fn<typeof useBundleDocuments>()
    .mockReturnValue({loading: true, results: []}),
}))

jest.mock('sanity', () => ({
  LoadingBlock: () => <div data-testid="mocked-loading-block" />,
  useClient: jest.fn().mockReturnValue({getUrl: jest.fn(), config: jest.fn().mockReturnValue({})}),
  useCurrentUser: jest.fn().mockReturnValue({id: 'test-user-id'}),
  useTranslation: jest.fn().mockReturnValue({t: jest.fn()}),
}))

jest.mock('../../../components/ReleasePublishAllButton/useObserveDocumentRevisions', () => ({
  useObserveDocumentRevisions: jest.fn().mockReturnValue({
    '123': 'mock revision id',
  }),
}))

jest.mock('../ReleaseSummary', () => ({
  ReleaseSummary: () => <div data-testid="mocked-release-summary" />,
}))

jest.mock('../documentTable/useReleaseHistory', () => ({
  useReleaseHistory: jest.fn().mockReturnValue({
    documentsHistory: new Map(),
  }),
}))

const mockUseBundles = useBundles as jest.Mock<typeof useBundles>
const mockUseBundleDocuments = useBundleDocuments as jest.Mock<typeof useBundleDocuments>
const mockRouterNavigate = jest.fn()

const renderTest = async () => {
  const wrapper = await createTestProvider({
    resources: [releasesUsEnglishLocaleBundle],
  })
  return render(
    <RouterProvider
      state={{
        bundleId: 'test-bundle-id',
      }}
      onNavigate={mockRouterNavigate}
      router={route.create('/', [route.create('/:bundleId')])}
    >
      <ReleaseDetail />
    </RouterProvider>,
    {wrapper},
  )
}

const publishAgnosticTests = () => {
  it('should allow for navigating back to releases overview', () => {
    screen.getByTestId('back-to-releases-button').click()
  })

  it('should show the release title', () => {
    screen.getAllByText('Test bundle')
  })

  it('should default to showing summary screen', () => {
    expect(screen.getByTestId('summary-button')).toHaveAttribute('data-selected', '')
  })
}

describe('ReleaseDetail', () => {
  describe('when loading bundles', () => {
    beforeEach(async () => {
      mockUseBundles.mockReturnValue({
        data: [],
        loading: true,
        dispatch: jest.fn(),
        deletedBundles: {},
      })
      await renderTest()
    })

    it('should show a loading spinner', () => {
      screen.getByTestId('mocked-loading-block')
    })

    it('does not show the rest of the screen ui', () => {
      expect(screen.queryByText('Publish all')).toBeNull()
      expect(screen.queryByText('Summary')).toBeNull()
      expect(screen.queryByText('Review changes')).toBeNull()
      expect(screen.queryByLabelText('Release menu')).toBeNull()
    })
  })

  describe('when loaded bundles but still loading bundle documents', () => {
    beforeEach(async () => {
      mockUseBundles.mockReturnValue({
        data: [
          {
            title: 'Test bundle',
            publishedAt: undefined,
            archivedAt: undefined,
            _id: 'test-bundle-id',
            _createdAt: new Date().toISOString(),
            _type: 'release',
            hue: 'blue',
            icon: 'string',
            authorId: 'author-id',
            _updatedAt: new Date().toISOString(),
            _rev: 'abc',
          },
        ],
        loading: false,
        dispatch: jest.fn(),
        deletedBundles: {},
      })
      await renderTest()
    })

    it('should show loading spinner', () => {
      screen.getByTestId('mocked-loading-block')
    })

    it('should show the header', () => {
      screen.getByText('Test bundle')
      screen.getByTestId('summary-button')
      expect(screen.getByTestId('review-button').closest('button')).toBeDisabled()
      screen.getByTestId('release-menu-button')
      expect(screen.getByTestId('publish-all-button').closest('button')).toBeDisabled()
    })
  })
})

describe('after bundles have loaded', () => {
  describe('with unpublished release', () => {
    const currentDate = new Date().toISOString()
    beforeEach(async () => {
      mockUseBundles.mockReturnValue({
        data: [
          {
            title: 'Test bundle',
            publishedAt: undefined,
            archivedAt: undefined,
            _id: 'test-bundle-id',
            _createdAt: currentDate,
            _type: 'release',
            hue: 'blue',
            icon: 'string',
            authorId: 'author-id',
            _updatedAt: currentDate,
            _rev: 'abc',
          },
        ],
        loading: false,
        dispatch: jest.fn(),
        deletedBundles: {},
      })
    })

    const loadedBundleAndDocumentsTests = () => {
      it('should allow for the release to be archived', () => {
        fireEvent.click(screen.getByTestId('release-menu-button'))
        screen.getByTestId('archive-release')
      })

      it('should navigate to release review changes screen', () => {
        expect(screen.getByTestId('review-button').closest('button')).not.toBeDisabled()
        fireEvent.click(screen.getByTestId('review-button'))
        expect(mockRouterNavigate).toHaveBeenCalledWith({
          path: '/test-bundle-id?screen=review',
        })
      })
    }

    describe('with pending document validation', () => {
      beforeEach(async () => {
        mockUseBundleDocuments.mockReturnValue({
          loading: false,
          results: [
            {
              memoKey: 'key123',
              document: {
                _id: 'test-bundle-id',
                _type: 'document',
                _rev: 'abc',
                _createdAt: currentDate,
                _updatedAt: currentDate,
              },
              validation: {
                hasError: false,
                isValidating: true,
                validation: [],
              },
              previewValues: {
                values: {title: 'Test document'},
                isLoading: false,
              },
            },
          ],
        })
        await renderTest()
      })

      publishAgnosticTests()
      loadedBundleAndDocumentsTests()

      it('should disable publish all button', () => {
        expect(screen.getByTestId('publish-all-button').closest('button')).toBeDisabled()
      })
    })

    describe('with passing document validation', () => {
      beforeEach(async () => {
        mockUseBundleDocuments.mockReturnValue({
          loading: false,
          results: [
            {
              memoKey: 'key123',
              document: {
                _id: 'test-bundle-id',
                _type: 'document',
                _rev: 'abc',
                _createdAt: currentDate,
                _updatedAt: currentDate,
              },
              validation: {
                hasError: false,
                isValidating: false,
                validation: [],
              },
              previewValues: {
                values: {title: 'Test document'},
                isLoading: false,
              },
            },
          ],
        })
        await renderTest()
      })

      publishAgnosticTests()
      loadedBundleAndDocumentsTests()

      it('should show publish all button when release not published', () => {
        expect(screen.getByTestId('publish-all-button').closest('button')).not.toBeDisabled()
      })

      it('should require confirmation to publish', () => {
        fireEvent.click(screen.getByTestId('publish-all-button'))
        screen.getByText('Are you sure you want to publish the release and all document versions?')
        fireEvent.click(screen.getByText('Cancel'))

        expect(screen.getByText('Publish all').closest('button')).not.toBeDisabled()
      })

      it('should perform publish', () => {
        fireEvent.click(screen.getByText('Publish all'))
        fireEvent.click(screen.getByText('Publish'))

        expect(useBundleOperations().publishBundle).toHaveBeenCalledWith(
          'test-bundle-id',
          [
            {
              _createdAt: currentDate,
              _id: 'test-bundle-id',
              _rev: 'abc',
              _type: 'document',
              _updatedAt: currentDate,
            },
          ],
          {'123': 'mock revision id'},
        )
      })
    })

    describe('with failing document validation', () => {
      beforeEach(async () => {
        mockUseBundleDocuments.mockReturnValue({
          loading: false,
          results: [
            {
              memoKey: 'key123',
              document: {
                _id: '123',
                _type: 'test',
                _rev: 'abc',
                _createdAt: currentDate,
                _updatedAt: currentDate,
              },
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
              previewValues: {
                values: {title: 'Test document'},
                isLoading: false,
              },
            },
          ],
        })
        await renderTest()
      })

      publishAgnosticTests()
      loadedBundleAndDocumentsTests()

      it('should disable publish all button', () => {
        expect(screen.getByTestId('publish-all-button')).toBeDisabled()
        fireEvent.mouseOver(screen.getByTestId('publish-all-button'))
      })
    })
  })

  describe('with published release', () => {
    beforeEach(async () => {
      mockUseBundles.mockReturnValue({
        data: [
          {
            title: 'Test bundle',
            publishedAt: new Date().toISOString(),
            archivedAt: new Date().toISOString(),
            _id: 'test-bundle-id',
            _createdAt: new Date().toISOString(),
            _type: 'release',
            hue: 'blue',
            icon: 'string',
            authorId: 'author-id',
            _updatedAt: new Date().toISOString(),
            _rev: 'abc',
          },
        ],
        loading: false,
        dispatch: jest.fn(),
        deletedBundles: {},
      })

      await renderTest()
    })

    publishAgnosticTests()

    it('should not show the publish button', () => {
      expect(screen.queryByText('Publish all')).toBeNull()
    })

    it('should allow for the release to be unarchived', () => {
      fireEvent.click(screen.getByTestId('release-menu-button'))
      screen.getByTestId('archive-release')
    })

    it('should not show the review changes button', () => {
      expect(screen.queryByText('Review changes')).toBeNull()
    })
  })

  describe('with deleted release', () => {
    beforeEach(async () => {
      mockUseBundles.mockReturnValue({
        data: [],
        loading: false,
        dispatch: jest.fn(),
        deletedBundles: {
          'test-bundle-id': {
            title: 'Test bundle',
            publishedAt: undefined,
            archivedAt: undefined,
            _id: 'test-bundle-id',
            _createdAt: new Date().toISOString(),
            _type: 'release',
            hue: 'blue',
            icon: 'string',
            authorId: 'author-id',
            _updatedAt: new Date().toISOString(),
            _rev: 'abc',
          },
        },
      })
      await renderTest()
    })

    publishAgnosticTests()

    it('should not show publish button', () => {
      expect(screen.queryByText('Publish all')).toBeNull()
    })

    it('should disable Bundle menu', () => {
      expect(screen.getByTestId('release-menu-button')).toBeDisabled()
    })
  })

  describe('with missing release', () => {
    beforeEach(async () => {
      mockUseBundles.mockReturnValue({
        data: [],
        loading: false,
        dispatch: jest.fn(),
        deletedBundles: {},
      })
      await renderTest()
    })

    it('should show missing release message', () => {
      screen.getByText('Release not found: test-bundle-id')
    })
  })
})
