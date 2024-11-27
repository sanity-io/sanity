import {act, fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import {format, set} from 'date-fns'
import {useRouter} from 'sanity/router'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {getByDataUi, queryByDataUi} from '../../../../../../test/setup/customQueries'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {
  getLocalTimeZoneMockReturn,
  mockGetLocaleTimeZone,
  mockUseTimeZone,
  useTimeZoneMockReturn,
} from '../../../../scheduledPublishing/hooks/__tests__/__mocks__/useTimeZone.mock'
import {
  activeASAPRelease,
  activeScheduledRelease,
  activeUndecidedRelease,
  archivedScheduledRelease,
  publishedASAPRelease,
  scheduledRelease,
} from '../../../__fixtures__/release.fixture'
import {
  mockUsePerspective,
  usePerspectiveMockReturn,
} from '../../../hooks/__tests__/__mocks__/usePerspective.mock'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {
  mockUseReleases,
  useReleasesMockReturn,
} from '../../../store/__tests__/__mocks/useReleases.mock'
import {
  mockUseReleasesMetadata,
  useReleasesMetadataMockReturn,
} from '../../../store/__tests__/__mocks/useReleasesMetadata.mock'
import {type ReleaseDocument} from '../../../store/types'
import {type ReleasesMetadata} from '../../../store/useReleasesMetadata'
import {useBundleDocumentsMockReturnWithResults} from '../../detail/__tests__/__mocks__/useBundleDocuments.mock'
import {ReleasesOverview} from '../ReleasesOverview'

const TODAY = set(new Date(), {
  hours: 22,
  minutes: 0,
  seconds: 0,
  milliseconds: 0,
})

vi.mock('sanity', () => ({
  SANITY_VERSION: '0.0.0',
  useCurrentUser: vi.fn().mockReturnValue({user: {id: 'user-id'}}),
  useTranslation: vi.fn().mockReturnValue({t: vi.fn()}),
}))

vi.mock('../../../store/useReleases', () => ({
  useReleases: vi.fn(() => useReleasesMockReturn),
}))

vi.mock('../../../store/useReleasesMetadata', () => ({
  useReleasesMetadata: vi.fn(() => useReleasesMetadataMockReturn),
}))

vi.mock('../../detail/useBundleDocuments', () => ({
  useBundleDocuments: vi.fn(() => useBundleDocumentsMockReturnWithResults),
}))

vi.mock('sanity/router', async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: vi.fn().mockReturnValue({state: {}, navigate: vi.fn()}),
}))

vi.mock('../../../hooks/usePerspective', () => ({
  usePerspective: vi.fn(() => usePerspectiveMockReturn),
}))

vi.mock('../../../../scheduledPublishing/hooks/useTimeZone', async (importOriginal) => ({
  ...(await importOriginal()),
  getLocalTimeZone: vi.fn(() => getLocalTimeZoneMockReturn),
  default: vi.fn(() => useTimeZoneMockReturn),
}))

describe('ReleasesOverview', () => {
  beforeEach(() => {
    mockUseReleases.mockRestore()
  })

  describe('when loading releases', () => {
    beforeEach(async () => {
      mockUseReleases.mockReturnValue({...useReleasesMockReturn, loading: true})

      const wrapper = await createTestProvider({
        resources: [releasesUsEnglishLocaleBundle],
      })

      return render(<ReleasesOverview />, {wrapper})
    })

    it('does not show releases table but shows loader', () => {
      expect(screen.queryByRole('table')).toBeNull()
      queryByDataUi(document.body, 'Spinner')
    })

    it('does not allow for switching between history modes', async () => {
      await waitFor(() => {
        screen.getByText('Open')
      })
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
    const releases: ReleaseDocument[] = [
      {
        ...activeScheduledRelease,
        metadata: {
          ...activeScheduledRelease.metadata,
          intendedPublishAt: TODAY.toISOString(),
        },
      },
      activeASAPRelease,
      activeUndecidedRelease,
      scheduledRelease,
    ]

    let activeRender: ReturnType<typeof render>

    beforeEach(async () => {
      mockUseTimeZone.mockRestore()
      mockUseReleases.mockReturnValue({
        ...useReleasesMockReturn,
        archivedReleases: [archivedScheduledRelease, publishedASAPRelease],
        data: releases,
      })
      mockUseReleasesMetadata.mockReturnValue({
        ...useReleasesMetadataMockReturn,
        data: Object.fromEntries(
          releases.map((release) => [
            release._id,
            {
              documentCount: 1,
            } as ReleasesMetadata,
          ]),
        ),
      })

      const wrapper = await createTestProvider({
        resources: [releasesUsEnglishLocaleBundle],
      })

      return act(() => {
        activeRender = render(<ReleasesOverview />, {wrapper})
      })
    })

    it('shows each open release', () => {
      const releaseRows = screen.getAllByTestId('table-row')
      expect(releaseRows).toHaveLength(4)

      const [unsortedFirstRelease, unsortedSecondRelease, unsortedThirdRelease] = releaseRows

      within(unsortedFirstRelease).getByText(activeASAPRelease.metadata.title)
      within(unsortedSecondRelease).getByText(scheduledRelease.metadata.title)
      within(unsortedThirdRelease).getByText(activeScheduledRelease.metadata.title)
    })

    it('shows time as ASAP for asap release types', () => {
      const asapReleaseRow = screen.getAllByTestId('table-row')[0]

      within(asapReleaseRow).getByText('ASAP')
    })

    it('shows time as Undecided for undecided release types', () => {
      const asapReleaseRow = screen.getAllByTestId('table-row')[3]

      within(asapReleaseRow).getByText('Undecided')
    })

    it('shows time for scheduled releases', () => {
      const scheduledReleaseRow = screen.getAllByTestId('table-row')[2]

      const date = format(TODAY, 'MMM d, yyyy')
      within(scheduledReleaseRow).getByText(`${date}, 10:00:00 PM`)
    })

    it('has release menu actions for each release', () => {
      const releaseRows = screen.getAllByTestId('table-row')
      releaseRows.forEach((row) => {
        within(row).getByTestId('release-menu-button')
      })
    })

    it('shows lock next to scheduled releases', () => {
      const scheduledReleaseRow = screen.getAllByTestId('table-row')[1]
      within(scheduledReleaseRow).getByTestId('release-avatar-primary')
      within(scheduledReleaseRow).getByTestId('release-lock-icon')
    })

    it('allows for switching between history modes', () => {
      expect(screen.getByText('Open').closest('button')).not.toBeDisabled()
      expect(screen.getByText('Archived').closest('button')).not.toBeDisabled()
    })

    it('allows for pinning perspectives', () => {
      fireEvent.click(
        within(screen.getAllByTestId('table-row')[0]).getByTestId('pin-release-button'),
      )

      expect(usePerspectiveMockReturn.setPerspectiveFromReleaseDocumentId).toHaveBeenCalledWith(
        '_.releases.activeASAPRelease',
      )
    })

    it('will show pinned release in release list', () => {
      mockUsePerspective.mockReturnValue({
        ...usePerspectiveMockReturn,
        currentGlobalBundleId: '_.releases.activeASAPRelease',
      })

      // re-render to apply the update to global bundle id
      activeRender.rerender(<ReleasesOverview />)

      const releaseRows = screen.getAllByTestId('table-row')
      const pinnedReleaseRow = releaseRows[0]

      expect(within(pinnedReleaseRow).getByTestId('pin-release-button')).toHaveAttribute(
        'data-selected',
        '',
      )
    })

    describe('calendar filter', () => {
      const getCalendar = () => getByDataUi(document.body, 'Calendar')

      it('has today in bold to signify that there is a release', () => {
        const todayTile = within(getByDataUi(document.body, 'Calendar')).getByTestId(
          'day-tile-today',
        )
        expect(todayTile.firstChild).toHaveStyle('font-weight: 700')
      })

      describe('selecting a release date', () => {
        beforeEach(() => {
          const todayTile = within(getByDataUi(document.body, 'Calendar')).getByTestId(
            'day-tile-today',
          )
          fireEvent.click(todayTile)
        })

        it('does not show open and archive filter group buttons', () => {
          expect(screen.queryByText('Open')).not.toBeInTheDocument()
          expect(screen.queryByText('Archived')).not.toBeInTheDocument()
        })

        it('filters releases by date', () => {
          const releaseRows = screen.getAllByTestId('table-row')

          expect(releaseRows).toHaveLength(1)
          within(releaseRows[0]).getByText(activeScheduledRelease.metadata.title)
        })

        it('clears the filter by clicking the selected date', async () => {
          // not ideal, but the easiest way of finding the now selected date
          const todayTile = getCalendar().querySelector('[data-selected]')
          fireEvent.click(todayTile!)

          await waitFor(() => {
            expect(screen.getAllByTestId('table-row')).toHaveLength(4)
          })
        })

        it('clears the filter by clicking the date filter button', async () => {
          fireEvent.click(screen.getByTestId('selected-date-filter'))

          await waitFor(() => {
            expect(screen.getAllByTestId('table-row')).toHaveLength(4)
          })
        })
      })
    })

    describe('timezone selection', () => {
      it('shows the selected timezone', () => {
        screen.getByText('SCT (Sanity/Oslo)')
      })

      it('opens the timezone selector', () => {
        fireEvent.click(screen.getByText('SCT (Sanity/Oslo)'))

        within(getByDataUi(document.body, 'DialogCard')).getByText('Select time zone')
      })

      it('shows dates with timezone abbreviation when it is not the locale', () => {
        mockGetLocaleTimeZone.mockReturnValue({
          abbreviation: 'NST', // Not Sanity Time
          namePretty: 'Not Sanity Time',
          offset: '+00:00',
          name: 'NST',
          alternativeName: 'Not Sanity Time',
          mainCities: 'Not Sanity City',
          value: 'Not Sanity Time',
        })

        activeRender.rerender(<ReleasesOverview />)

        const scheduledReleaseRow = screen.getAllByTestId('table-row')[2]

        const date = format(TODAY, 'MMM d, yyyy')
        within(scheduledReleaseRow).getByText(`${date}, 10:00:00 PM (SCT)`)
      })

      describe('when a different timezone is selected', () => {
        beforeEach(() => {
          mockUseTimeZone.mockReturnValue({
            ...useTimeZoneMockReturn,
            // spoof a timezone that is 8 hours ahead of UTC
            zoneDateToUtc: vi.fn((date) => set(date, {hours: new Date(date).getHours() - 8})),
          })

          activeRender.rerender(<ReleasesOverview />)
        })

        it('shows today as having no releases', () => {
          const todayTile = within(getByDataUi(document.body, 'Calendar')).getByTestId(
            'day-tile-today',
          )
          expect(todayTile.parentNode).not.toHaveStyle('font-weight: 700')
        })

        it('shows no releases when filtered by today', () => {
          const todayTile = within(getByDataUi(document.body, 'Calendar')).getByTestId(
            'day-tile-today',
          )
          fireEvent.click(todayTile)

          expect(screen.queryAllByTestId('table-row')).toHaveLength(0)
        })
      })
    })

    describe('archived releases', () => {
      beforeEach(() => {
        fireEvent.click(screen.getByText('Archived'))
      })

      it('shows published releases', async () => {
        const archivedReleaseRow = screen.getAllByTestId('table-row')[0]
        within(archivedReleaseRow).getByText('published Release')
      })

      it('shows archived releases', async () => {
        const publishedReleaseRow = screen.getAllByTestId('table-row')[1]
        within(publishedReleaseRow).getByText('archived Release')
        within(publishedReleaseRow).getByTestId('release-avatar-default')
      })

      it('does not allow for perspective pinning', () => {
        screen.getAllByTestId('table-row').forEach((row) => {
          expect(within(row).getByTestId('pin-release-button').closest('button')).toBeDisabled()
        })
      })
    })

    it('sorts the list of releases', () => {
      const [unsortedFirstRelease, unsortedSecondRelease, unsortedThirdRelease] =
        screen.getAllByTestId('table-row')

      // default sort asap, then scheduled by publish asc
      within(unsortedFirstRelease).getByText(activeASAPRelease.metadata.title)
      within(unsortedSecondRelease).getByText(scheduledRelease.metadata.title)
      within(unsortedThirdRelease).getByText(activeScheduledRelease.metadata.title)

      // sort by asc publish at
      fireEvent.click(screen.getByText('Time'))
      const [
        // first release is undecided
        _,
        descPublishSortedFirstRelease,
        descPublishSortedSecondRelease,
        descPublishSortedThirdRelease,
      ] = screen.getAllByTestId('table-row')
      within(descPublishSortedFirstRelease).getByText(activeScheduledRelease.metadata.title)
      within(descPublishSortedSecondRelease).getByText(scheduledRelease.metadata.title)
      within(descPublishSortedThirdRelease).getByText(activeASAPRelease.metadata.title)
    })

    it('should navigate to release when row clicked', async () => {
      const releaseRow = screen.getAllByTestId('table-row')[0]
      fireEvent.click(within(releaseRow).getByText(activeASAPRelease.metadata.title))

      expect(useRouter().navigate).toHaveBeenCalledWith({releaseId: 'activeASAPRelease'})
    })
  })
})
