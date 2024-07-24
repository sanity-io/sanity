import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react'
import {route, RouterProvider} from 'sanity/router'

import {createWrapper} from '../../../../../../test/testUtils/createWrapper'
import {useListener} from '../../../../hooks/useListener'
import {useBundles} from '../../../../store/bundles'
import {ReleaseDetail} from '../ReleaseDetail'

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

const mockUseBundles = useBundles as jest.Mock<typeof useBundles>
const mockUseListener = useListener as jest.Mock<typeof useListener>
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

  it('should navigate to release review changes screen', () => {
    expect(screen.getByText('Review changes').closest('button')).not.toBeDisabled()
    fireEvent.click(screen.getByText('Review changes'))
    expect(mockRouterNavigate).toHaveBeenCalledWith({
      path: '/test-bundle-slug?screen=review',
    })
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

    describe('when loaded bundles but still loading bundle documents', () => {
      beforeEach(async () => {
        mockUseBundles.mockReturnValue({data: [], loading: false, dispatch: jest.fn()})
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

        await renderTest()
      })

      publishAgnosticTests()

      it('should show publish button when release not published', () => {
        expect(screen.getByText('Publish all').closest('button')).not.toBeDisabled()
      })

      it('should allow for the release to be archived', () => {
        fireEvent.click(screen.getByLabelText('Release menu'))
        screen.getByText('Archive')
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
    })
  })
})
