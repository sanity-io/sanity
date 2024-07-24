import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react'
import {route, RouterProvider} from 'sanity/router'

import {createWrapper} from '../../../../../../test/testUtils/createWrapper'
import {useListener} from '../../../../hooks/useListener'
import {useBundles} from '../../../../store/bundles'
import {ReleaseDetail} from '../ReleaseDetail'
import {useBundleDocumentsValidation} from '../useBundleDocumentsValidation'

jest.mock('../../../../store/bundles', () => ({
  useBundles: jest.fn().mockReturnValue({data: [], loading: false}),
}))

jest.mock('../../../../hooks/useListener', () => ({
  useListener: jest.fn().mockReturnValue({documents: [], loading: false}),
}))

jest.mock('../useBundleDocumentsValidation', () => ({
  useBundleDocumentsValidation: jest.fn().mockReturnValue({}),
}))

jest.mock('sanity', () => ({
  LoadingBlock: () => <div data-testid="mocked-loading-block" />,
  useClient: jest.fn().mockReturnValue({getUrl: jest.fn(), config: jest.fn().mockReturnValue({})}),
  useCurrentUser: jest.fn().mockReturnValue({id: 'test-user-id'}),
}))

jest.mock('../ReleaseSummary', () => ({
  ReleaseSummary: () => <div data-testid="mocked-release-summary" />,
}))

jest.mock('../documentTable/useReleaseHistory', () => ({
  useReleaseHistory: jest.fn().mockReturnValue({
    documentsHistory: new Map(),
  }),
}))

jest.mock('../useBundleDocumentsValidation', () => ({
  useBundleDocumentsValidation: jest.fn().mockReturnValue({}),
}))

const mockUseBundles = useBundles as jest.Mock<typeof useBundles>
const mockUseListener = useListener as jest.Mock<typeof useListener>
const mockUseBundleDocumentsValidation = useBundleDocumentsValidation as jest.Mock<
  typeof useBundleDocumentsValidation
>
const mockRouterNavigate = jest.fn()

const renderTest = async () => {
  const wrapper = await createWrapper()
  return render(
    <RouterProvider
      state={{
        bundleSlug: 'test-bundle-slug',
      }}
      onNavigate={mockRouterNavigate}
      router={route.create('/', [route.create('/:bundleSlug')])}
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
    expect(screen.getByText('Summary').closest('button')).toHaveAttribute('data-selected', '')
  })
}

describe('ReleaseDetail', () => {
  describe('when loading bundles', () => {
    beforeEach(async () => {
      mockUseBundles.mockReturnValue({data: [], loading: true, dispatch: jest.fn()})
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
            _id: 'test-id',
            _createdAt: new Date().toISOString(),
            _type: 'bundle',
            slug: 'test-bundle-slug',
            hue: 'blue',
            icon: 'string',
            authorId: 'author-id',
            _updatedAt: new Date().toISOString(),
            _rev: 'abc',
          },
        ],
        loading: false,
        dispatch: jest.fn(),
      })
      mockUseListener.mockReturnValue({
        documents: [],
        loading: true,
        error: null,
        dispatch: jest.fn(),
      })
      await renderTest()
    })

    it('should show loading spinner', () => {
      screen.getByTestId('mocked-loading-block')
    })

    it('should show the header', () => {
      screen.getByText('Test bundle')
      screen.getByText('Summary')
      expect(screen.getByText('Review changes').closest('button')).toBeDisabled()
      screen.getByLabelText('Release menu')
      expect(screen.getByText('Publish all').closest('button')).toBeDisabled()
    })
  })
})

describe('after bundles have loaded', () => {
  describe('with unpublished release', () => {
    beforeEach(async () => {
      mockUseBundles.mockReturnValue({
        data: [
          {
            title: 'Test bundle',
            publishedAt: undefined,
            archivedAt: undefined,
            _id: 'test-id',
            _createdAt: new Date().toISOString(),
            _type: 'bundle',
            slug: 'test-bundle-slug',
            hue: 'blue',
            icon: 'string',
            authorId: 'author-id',
            _updatedAt: new Date().toISOString(),
            _rev: 'abc',
          },
        ],
        loading: false,
        dispatch: jest.fn(),
      })
      mockUseListener.mockReturnValue({
        documents: [
          {
            _id: 'test-id',
            _type: 'document',
            _rev: 'abc',
            _createdAt: new Date().toISOString(),
            _updatedAt: new Date().toISOString(),
          },
        ],
        loading: false,
        dispatch: jest.fn(),
        error: null,
      })
    })

    const loadedBundleAndDocumentsTests = () => {
      it('should allow for the release to be archived', () => {
        fireEvent.click(screen.getByLabelText('Release menu'))
        screen.getByText('Archive')
      })

      it('should navigate to release review changes screen', () => {
        expect(screen.getByText('Review changes').closest('button')).not.toBeDisabled()
        fireEvent.click(screen.getByText('Review changes'))
        expect(mockRouterNavigate).toHaveBeenCalledWith({
          path: '/test-bundle-slug?screen=review',
        })
      })
    }

    describe('with pending documnt validation', () => {
      beforeEach(async () => {
        mockUseBundleDocumentsValidation.mockReturnValue({
          'test-bundle-slug': {
            documentId: '123',
            hasError: false,
            isValidating: true,
            validation: [],
          },
        })
        await renderTest()
      })

      publishAgnosticTests()
      loadedBundleAndDocumentsTests()

      it('should disable publish all button', () => {
        expect(screen.getByText('Publish all').closest('button')).toBeDisabled()
      })
    })

    describe('with passing document validation', () => {
      beforeEach(async () => {
        mockUseBundleDocumentsValidation.mockReturnValue({
          'test-bundle-slug': {
            documentId: '123',
            hasError: false,
            isValidating: false,
            validation: [],
          },
        })
        await renderTest()
      })

      publishAgnosticTests()
      loadedBundleAndDocumentsTests()

      it('should show publish all button when release not published', () => {
        expect(screen.getByText('Publish all').closest('button')).not.toBeDisabled()
      })
    })

    describe('with failing document validation', () => {
      beforeEach(async () => {
        mockUseBundleDocumentsValidation.mockReturnValue({
          'test-bundle-slug': {
            documentId: '123',
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
        })
        await renderTest()
      })

      publishAgnosticTests()
      loadedBundleAndDocumentsTests()

      it('should disable publish all button', () => {
        expect(screen.getByText('Publish all').closest('button')).toBeDisabled()
        fireEvent.mouseOver(screen.getByText('Publish all'))
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
            _id: 'test-id',
            _createdAt: new Date().toISOString(),
            _type: 'bundle',
            slug: 'test-bundle-slug',
            hue: 'blue',
            icon: 'string',
            authorId: 'author-id',
            _updatedAt: new Date().toISOString(),
            _rev: 'abc',
          },
        ],
        loading: false,
        dispatch: jest.fn(),
      })
      mockUseListener.mockReturnValue({
        documents: [
          {
            _id: 'test-id',
            _type: 'document',
            _rev: 'abc',
            _createdAt: new Date().toISOString(),
            _updatedAt: new Date().toISOString(),
          },
        ],
        loading: false,
        dispatch: jest.fn(),
        error: null,
      })

      await renderTest()
    })

    publishAgnosticTests()

    it('should not show the publish button', () => {
      expect(screen.queryByText('Publish all')).toBeNull()
    })

    it('should allow for the release to be unarchived', () => {
      fireEvent.click(screen.getByLabelText('Release menu'))
      screen.getByText('Unarchive')
    })

    it('should not show the review changes button', () => {
      expect(screen.queryByText('Review changes')).toBeNull()
    })
  })
})
