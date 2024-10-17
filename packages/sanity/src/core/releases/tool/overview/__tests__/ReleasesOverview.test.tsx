import {fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import {useRouter} from 'sanity/router'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {queryByDataUi} from '../../../../../../test/setup/customQueries'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {useBundles} from '../../../../store'
import {type BundleDocument} from '../../../../store/bundles/types'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {type BundlesMetadata, useBundlesMetadata} from '../../useBundlesMetadata'
import {ReleasesOverview} from '../ReleasesOverview'

vi.mock('sanity', () => {
  return {
    SANITY_VERSION: '0.0.0',
    Translate: vi.fn(),
    useCurrentUser: vi.fn().mockReturnValue({user: {id: 'user-id'}}),
    useTranslation: vi.fn().mockReturnValue({t: vi.fn()}),
  }
})

vi.mock('../../useBundlesMetadata', () => ({
  useBundlesMetadata: vi.fn(),
}))

vi.mock('../../../../store', async (importOriginal) => ({
  ...(await importOriginal()),
  useBundles: vi.fn(),
}))

vi.mock('sanity/router', async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: vi.fn().mockReturnValue({state: {}, navigate: vi.fn()}),
}))

const mockUseBundles = useBundles as Mock<typeof useBundles>
const mockUseBundlesMetadata = useBundlesMetadata as Mock<typeof useBundlesMetadata>

describe('ReleasesOverview', () => {
  describe('when loading bundles', () => {
    beforeEach(async () => {
      mockUseBundles.mockReturnValue({
        data: null,
        loading: true,
        dispatch: vi.fn(),
        deletedBundles: {},
      })
      mockUseBundlesMetadata.mockReturnValue({
        loading: true,
        error: null,
        data: null,
      })

      const wrapper = await createTestProvider({
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
        dispatch: vi.fn(),
        deletedBundles: {},
      })
      mockUseBundlesMetadata.mockReturnValue({
        loading: false,
        error: null,
        data: null,
      })
      const wrapper = await createTestProvider({
        resources: [releasesUsEnglishLocaleBundle],
      })

      return render(<ReleasesOverview />, {wrapper})
    })

    it('shows a message about bundles', () => {
      screen.getByTestId('no-bundles-info-text')
    })

    it('does not show the bundles table', () => {
      expect(screen.queryByRole('table')).toBeNull()
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
      {
        title: 'Bundle 1',
        _id: 'b1abcdefg',
        slug: 'bundle-1',
        // yesterday
        _createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        title: 'Bundle 2',
        _id: 'b2abcdefg',
        slug: 'bundle-2',
        // now
        _createdAt: new Date().toISOString(),
      },
      {
        title: 'Bundle 3',
        _id: 'b3abcdefg',
        publishedAt: new Date().toISOString(),
        slug: 'bundle-3',
        _createdAt: new Date().toISOString(),
      },
      {
        title: 'Bundle 4',
        _id: 'b4abcdefg',
        archivedAt: new Date().toISOString(),
        _createdAt: new Date().toISOString(),
      },
    ] as BundleDocument[]

    beforeEach(async () => {
      mockUseBundles.mockReturnValue({
        data: bundles,
        loading: false,
        dispatch: vi.fn(),
        deletedBundles: {
          'deleted-bundle-id': {
            title: 'Deleted Bundle',
            _id: 'deleted-bundle-id',
            _createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * 5).toISOString(),
          } as BundleDocument,
        },
      })
      mockUseBundlesMetadata.mockReturnValue({
        loading: false,
        error: null,
        data: Object.fromEntries(
          bundles.map((bundle, index) => [
            bundle._id,
            {
              documentCount: 1,
              updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * (index + 1)).toISOString(),
            } as BundlesMetadata,
          ]),
        ),
      })
      const wrapper = await createTestProvider({
        resources: [releasesUsEnglishLocaleBundle],
      })

      return render(<ReleasesOverview />, {wrapper})
    })

    it('shows each open bundle', () => {
      const bundleRows = screen.getAllByTestId('table-row')
      // 2 open releases & 1 deleted release)
      expect(bundleRows).toHaveLength(3)

      // reverse to match default sort order by _createdAt desc
      const openBundles = [...bundles].slice(0, 2).reverse()
      openBundles.forEach((bundle, index) => {
        // bundle title
        within(bundleRows[index]).getByText(bundle.title)
        // document count
        within(bundleRows[index]).getByText('1')
        if (index === 0) {
          // updated at
          within(bundleRows[index]).getByText('2 days ago')
          // created at
          within(bundleRows[index]).getByText('just now')
        } else if (index === 1) {
          // updated at & created at
          expect(within(bundleRows[index]).getAllByText('yesterday')).toHaveLength(2)
        }
      })
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

    it('sorts the list of releases', () => {
      const [unsortedFirstBundle, unsortedSecondBundle] = screen.getAllByTestId('table-row')
      within(unsortedFirstBundle).getByText('Bundle 2')
      within(unsortedSecondBundle).getByText('Bundle 1')

      // sort by asc created at
      fireEvent.click(screen.getByText('Created'))
      const [
        ascCreatedSortedFirstBundle,
        ascCreatedSortedSecondBundle,
        ascCreatedSortedThirdBundle,
      ] = screen.getAllByTestId('table-row')
      within(ascCreatedSortedFirstBundle).getByText('Deleted Bundle')
      within(ascCreatedSortedSecondBundle).getByText('Bundle 1')
      within(ascCreatedSortedThirdBundle).getByText('Bundle 2')

      // searching retains sort order
      fireEvent.change(screen.getByPlaceholderText('Search releases'), {
        target: {value: 'Bundle'},
      })
      const [
        ascCreatedSortedFirstBundleAfterSearch,
        ascCreatedSortedSecondBundleAfterSearch,
        ascCreatedSortedThirdBundleAfterSearch,
      ] = screen.getAllByTestId('table-row')
      within(ascCreatedSortedFirstBundleAfterSearch).getByText('Deleted Bundle')
      within(ascCreatedSortedSecondBundleAfterSearch).getByText('Bundle 1')
      within(ascCreatedSortedThirdBundleAfterSearch).getByText('Bundle 2')

      // sort by desc created at
      fireEvent.click(screen.getByText('Created'))
      const [descCreatedSortedFirstBundle, descCreatedSortedSecondBundle] =
        screen.getAllByTestId('table-row')
      within(descCreatedSortedFirstBundle).getByText('Bundle 2')
      within(descCreatedSortedSecondBundle).getByText('Bundle 1')

      // sort by asc updated at
      fireEvent.click(screen.getByText('Edited'))
      const [ascEditedSortedFirstBundle, ascEditedSortedSecondBundle] =
        screen.getAllByTestId('table-row')
      within(ascEditedSortedFirstBundle).getByText('Bundle 1')
      within(ascEditedSortedSecondBundle).getByText('Bundle 2')
    })

    it('should navigate to release when row clicked', async () => {
      const bundleRow = screen.getAllByTestId('table-row')[1]
      fireEvent.click(within(bundleRow).getByText('Bundle 1'))

      expect(useRouter().navigate).toHaveBeenCalledWith({releaseId: 'b1abcdefg'})
    })
  })
})
