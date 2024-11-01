import {act, fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import {useRouter} from 'sanity/router'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {queryByDataUi} from '../../../../../../test/setup/customQueries'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {useReleases} from '../../../index'
import {type ReleaseDocument} from '../../../store/types'
import {type ReleasesMetadata, useReleasesMetadata} from '../../../store/useReleasesMetadata'
import {ReleasesOverview} from '../ReleasesOverview'

vi.mock('sanity', () => {
  return {
    SANITY_VERSION: '0.0.0',
    useCurrentUser: vi.fn().mockReturnValue({user: {id: 'user-id'}}),
    useTranslation: vi.fn().mockReturnValue({t: vi.fn()}),
    usePerspective: vi.fn().mockReturnValue({currentGlobalBundle: {_id: 'global-bundle-id'}}),
    ReleaseAvatar: vi.fn(),
  }
})

vi.mock('../../../../../i18n', () => ({
  Translate: vi.fn(),
  useTranslation: vi.fn().mockReturnValue({t: vi.fn()}),
}))

vi.mock('../../../../store/release/useReleasesMetadata', () => ({
  useReleasesMetadata: vi.fn(),
}))

vi.mock('../../../../store/release/useReleases', async (importOriginal) => ({
  ...(await importOriginal()),
  useReleases: vi.fn(),
}))

vi.mock('sanity/router', async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: vi.fn().mockReturnValue({state: {}, navigate: vi.fn()}),
}))

const mockUseReleases = useReleases as Mock<typeof useReleases>
const mockUseReleasesMetadata = useReleasesMetadata as Mock<typeof useReleasesMetadata>

describe.todo('ReleasesOverview', () => {
  describe('when loading releases', () => {
    beforeEach(async () => {
      mockUseReleases.mockReturnValue({
        data: [],
        loading: true,
        dispatch: vi.fn(),
        stack: [],
      })
      mockUseReleasesMetadata.mockReturnValue({
        loading: true,
        error: null,
        data: null,
      })

      const wrapper = await createTestProvider({
        resources: [releasesUsEnglishLocaleBundle],
      })

      return render(<ReleasesOverview />, {wrapper})
    })

    it('does not show releases table but shows loader', () => {
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

    it('allows for creating a new release', () => {
      expect(screen.getByText('New release')).not.toBeDisabled()
    })
  })

  describe('when no releases are available', () => {
    beforeEach(async () => {
      mockUseReleases.mockReturnValue({
        data: [],
        loading: false,
        dispatch: vi.fn(),
        stack: [],
      })
      mockUseReleasesMetadata.mockReturnValue({
        loading: false,
        error: null,
        data: null,
      })
      const wrapper = await createTestProvider({
        resources: [releasesUsEnglishLocaleBundle],
      })

      return render(<ReleasesOverview />, {wrapper})
    })

    it('shows a message about releases', () => {
      screen.getByTestId('no-releases-info-text')
    })

    it('does not show the releases table', () => {
      expect(screen.queryByRole('table')).toBeNull()
    })

    it('does not show release history mode switch', () => {
      expect(screen.queryByText('Open')).toBeNull()
      expect(screen.queryByText('Archived')).toBeNull()
    })

    it('shows the page heading', () => {
      screen.getByText('Releases')
    })

    it('shows create new releases button', () => {
      expect(screen.getByText('New release')).not.toBeDisabled()
    })
  })

  describe('when releases are loaded', () => {
    const YESTERDAY = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const NOW = new Date().toISOString()
    const releases = [
      {
        _id: 'b1abcdefg',
        // yesterday
        _createdAt: YESTERDAY,
        _updatedAt: YESTERDAY,
        metadata: {
          title: 'Release 1',
        },
      },
      {
        _id: 'b2abcdefg',
        // now
        _createdAt: NOW,
        _updatedAt: NOW,
        metadata: {
          title: 'Release 2',
        },
      },
      {
        _id: 'b3abcdefg',
        _createdAt: NOW,
        _updatedAt: NOW,
        state: 'published',
        publishAt: NOW,
        metadata: {
          title: 'Release 3',
        },
      },
      {
        _id: 'b4abcdefg',
        _createdAt: NOW,
        _updatedAt: NOW,
        state: 'archived',
        metadata: {
          archivedAt: NOW,
          title: 'Release 4',
        },
      },
    ] satisfies ReleaseDocument[]

    beforeEach(async () => {
      mockUseReleases.mockReturnValue({
        data: releases,
        loading: false,
        dispatch: vi.fn(),
        stack: [],
      })
      mockUseReleasesMetadata.mockReturnValue({
        loading: false,
        error: null,
        data: Object.fromEntries(
          releases.map((release, index) => [
            release._id,
            {
              documentCount: 1,
              updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * (index + 1)).toISOString(),
            } as ReleasesMetadata,
          ]),
        ),
      })
      const wrapper = await createTestProvider({
        resources: [releasesUsEnglishLocaleBundle],
      })

      return act(() => render(<ReleasesOverview />, {wrapper}))
    })

    it.todo('shows each open release', () => {
      const releaseRows = screen.getAllByTestId('table-row')
      // 2 open releases & 1 deleted release)
      expect(releaseRows).toHaveLength(3)

      // reverse to match default sort order by _createdAt desc
      const openReleases = [...releases].slice(0, 2).reverse()
      openReleases.forEach((release, index) => {
        // release title
        within(releaseRows[index]).getByText(release.metadata.title)
        // document count
        within(releaseRows[index]).getByText('1')
        if (index === 0) {
          // updated at
          within(releaseRows[index]).getByText('2 days ago')
          // created at
        } else if (index === 1) {
          // updated
          expect(within(releaseRows[index]).getByText('yesterday'))
        }
      })
    })

    it('allows for switching between history modes', () => {
      expect(screen.getByText('Open').closest('button')).not.toBeDisabled()
      expect(screen.getByText('Archived').closest('button')).not.toBeDisabled()
    })

    it('shows published releases', async () => {
      fireEvent.click(screen.getByText('Archived'))

      await waitFor(() => {
        screen.getByText('Release 3')
        screen.getByText('Release 4')
        expect(screen.queryByText('Release 1')).toBeNull()
      })
    })

    it.todo('sorts the list of releases', () => {
      const [unsortedFirstRelease, unsortedSecondRelease] = screen.getAllByTestId('table-row')
      within(unsortedFirstRelease).getByText('Release 2')
      within(unsortedSecondRelease).getByText('Release 1')

      // sort by asc created at
      fireEvent.click(screen.getByText('Created'))
      const [
        ascCreatedSortedFirstRelease,
        ascCreatedSortedSecondRelease,
        ascCreatedSortedThirdRelease,
      ] = screen.getAllByTestId('table-row')
      within(ascCreatedSortedFirstRelease).getByText('Deleted Release')
      within(ascCreatedSortedSecondRelease).getByText('Release 1')
      within(ascCreatedSortedThirdRelease).getByText('Release 2')

      // searching retains sort order
      fireEvent.change(screen.getByPlaceholderText('Search releases'), {
        target: {value: 'Release'},
      })
      const [
        ascCreatedSortedFirstReleaseAfterSearch,
        ascCreatedSortedSecondReleaseAfterSearch,
        ascCreatedSortedThirdReleaseAfterSearch,
      ] = screen.getAllByTestId('table-row')
      within(ascCreatedSortedFirstReleaseAfterSearch).getByText('Deleted Release')
      within(ascCreatedSortedSecondReleaseAfterSearch).getByText('Release 1')
      within(ascCreatedSortedThirdReleaseAfterSearch).getByText('Release 2')

      // sort by desc created at
      fireEvent.click(screen.getByText('Created'))
      const [descCreatedSortedFirstRelease, descCreatedSortedSecondRelease] =
        screen.getAllByTestId('table-row')
      within(descCreatedSortedFirstRelease).getByText('Release 2')
      within(descCreatedSortedSecondRelease).getByText('Release 1')

      // sort by asc updated at
      fireEvent.click(screen.getByText('Edited'))
      const [ascEditedSortedFirstRelease, ascEditedSortedSecondRelease] =
        screen.getAllByTestId('table-row')
      within(ascEditedSortedFirstRelease).getByText('Release 1')
      within(ascEditedSortedSecondRelease).getByText('Release 2')
    })

    it('should navigate to release when row clicked', async () => {
      const releaseRow = screen.getAllByTestId('table-row')[1]
      fireEvent.click(within(releaseRow).getByText('Release 1'))

      expect(useRouter().navigate).toHaveBeenCalledWith({releaseId: 'b1abcdefg'})
    })
  })
})
