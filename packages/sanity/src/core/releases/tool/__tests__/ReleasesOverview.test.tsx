import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {fireEvent, render, screen, waitFor} from '@testing-library/react'

import {queryByDataUi} from '../../../../../test/setup/customQueries'
import {createWrapper} from '../../../bundles/util/tests/createWrapper'
import {useBundles} from '../../../store/bundles'
import {type BundleDocument} from '../../../store/bundles/types'
import {releasesUsEnglishLocaleBundle} from '../../i18n'
import {ReleasesOverview} from '../ReleasesOverview'
import {type BundlesMetadata, useBundlesMetadata} from '../useBundlesMetadata'

jest.mock('../useBundlesMetadata', () => ({
  useBundlesMetadata: jest.fn(),
}))

jest.mock('../../../store/bundles/useBundles', () => ({
  useBundles: jest.fn(),
}))

jest.mock('sanity', () => ({
  useCurrentUser: jest.fn().mockReturnValue({id: 'user-id'}),
}))

jest.mock('sanity/router', () => ({
  ...(jest.requireActual('sanity/router') || {}),
  useRouter: jest.fn().mockReturnValue({state: {}, navigate: jest.fn()}),
}))

const mockUseBundles = useBundles as jest.Mock<typeof useBundles>
const mockUseBundlesMetadata = useBundlesMetadata as jest.Mock<typeof useBundlesMetadata>

describe('ReleasesOverview', () => {
  describe('when loading bundles', () => {
    beforeEach(async () => {
      mockUseBundles.mockReturnValue({
        data: null,
        loading: true,
        dispatch: jest.fn(),
      })
      mockUseBundlesMetadata.mockReturnValue({
        loading: true,
        fetching: true,
        error: null,
        data: null,
      })

      const wrapper = await createWrapper({
        resources: [releasesUsEnglishLocaleBundle],
      })

      return render(<ReleasesOverview />, {wrapper})
    })

    it('does not show bundles table but shows loader', () => {
      expect(screen.queryByRole('table')).toBeNull()
      queryByDataUi(document.body, 'Spinner')
    })

    it('does not allow for switching between history modes', () => {
      expect(screen.getByText('Open').closest('button')).toBeDisabled()
      expect(screen.getByText('Archived').closest('button')).toBeDisabled()
    })

    it('does show the page heading', () => {
      screen.getByText('Releases')
    })

    it('allows for creating a new bundle', () => {
      expect(screen.getByText('Create release')).not.toBeDisabled()
    })
  })

  describe('when no bundles are available', () => {
    beforeEach(async () => {
      mockUseBundles.mockReturnValue({
        data: [],
        loading: false,
        dispatch: jest.fn(),
      })
      mockUseBundlesMetadata.mockReturnValue({
        loading: false,
        fetching: false,
        error: null,
        data: null,
      })
      const wrapper = await createWrapper()

      return render(<ReleasesOverview />, {wrapper})
    })

    it('shows a message that no bundles are available', () => {
      screen.getByText('No Releases')
    })

    it('does not show bundle history mode switch', () => {
      expect(screen.queryByText('Open')).toBeNull()
      expect(screen.queryByText('Archived')).toBeNull()
    })

    it('shows the page heading', () => {
      screen.getByText('Releases')
    })

    it('shows create releases button', () => {
      expect(screen.getByText('Create release')).not.toBeDisabled()
    })
  })

  describe('when bundles are loaded', () => {
    const bundles = [
      {title: 'Bundle 1', name: 'bundle-1', _createdAt: new Date().toISOString()},
      {title: 'Bundle 2', name: 'bundle-2', _createdAt: new Date().toISOString()},
      {
        title: 'Bundle 3',
        publishedAt: new Date().toISOString(),
        name: 'bundle-3',
        _createdAt: new Date().toISOString(),
      },
      {
        title: 'Bundle 4',
        archivedAt: new Date().toISOString(),
        name: 'bundle-4',
        _createdAt: new Date().toISOString(),
      },
    ] as BundleDocument[]

    beforeEach(async () => {
      mockUseBundles.mockReturnValue({
        data: bundles,
        loading: false,
        dispatch: jest.fn(),
      })
      mockUseBundlesMetadata.mockReturnValue({
        loading: false,
        fetching: false,
        error: null,
        data: Object.fromEntries(
          bundles.map((bundle) => [
            bundle.name,
            {
              documentCount: 1,
            } as BundlesMetadata,
          ]),
        ),
      })
      const wrapper = await createWrapper()

      return render(<ReleasesOverview />, {wrapper})
    })
    it('shows each open bundle', () => {
      screen.getByText('Bundle 1')
      screen.getByText('Bundle 2')
    })

    it('allows for switching between history modes', () => {
      expect(screen.getByText('Open').closest('button')).not.toBeDisabled()
      expect(screen.getByText('Archived').closest('button')).not.toBeDisabled()
    })

    it('shows published bundles', async () => {
      fireEvent.click(screen.getByText('Archived'))

      await waitFor(() => {
        screen.getByText('Bundle 3')
        screen.getByText('Bundle 4')
        expect(screen.queryByText('Bundle 1')).toBeNull()
      })
    })

    it('allows for searching bundles', () => {
      expect(screen.getByPlaceholderText('Search releases')).not.toBeDisabled()
      fireEvent.change(screen.getByPlaceholderText('Search releases'), {
        target: {value: 'Bundle 1'},
      })

      screen.getByText('Bundle 1')
      expect(screen.queryByText('Bundle 2')).toBeNull()

      // search for non-existent bundle title
      fireEvent.change(screen.getByPlaceholderText('Search releases'), {
        target: {value: 'Bananas'},
      })

      screen.getByText('No Releases')
      expect(screen.queryByText('Bundle 1')).toBeNull()
    })
  })
})
