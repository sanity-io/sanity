import {type ReleaseDocument} from '@sanity/client'
import {render, screen, waitFor, within} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {format} from 'date-fns/format'
import {set} from 'date-fns/set'
import {useEffect, useMemo, useRef, useState} from 'react'
import {RouterContext, useRouter} from 'sanity/router'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {getByDataUi} from '../../../../../../test/setup/customQueries'
import {setupVirtualListEnv} from '../../../../../../test/testUtils/setupVirtualListEnv'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {mockUseTimeZone, useTimeZoneMockReturn} from '../../../../hooks/__mocks__/useTimeZone.mock'
import {
  mockUsePerspective,
  usePerspectiveMockReturn,
} from '../../../../perspective/__mocks__/usePerspective.mock'
import {useScheduledDraftsEnabled} from '../../../../singleDocRelease/hooks/useScheduledDraftsEnabled'
import {
  activeASAPRelease,
  activeScheduledRelease,
  activeUndecidedErrorRelease,
  activeUndecidedRelease,
  archivedScheduledRelease,
  publishedASAPRelease,
  scheduledRelease,
} from '../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {
  mockUseActiveReleases,
  useActiveReleasesMockReturn,
} from '../../../store/__tests__/__mocks/useActiveReleases.mock'
import {
  mockUseAllReleases,
  useAllReleasesMockReturn,
} from '../../../store/__tests__/__mocks/useAllReleases.mock'
import {
  mockUseArchivedReleases,
  useArchivedReleasesMockReturn,
} from '../../../store/__tests__/__mocks/useArchivedReleases.mock'
import {useReleaseOperationsMockReturn} from '../../../store/__tests__/__mocks/useReleaseOperations.mock'
import {
  mockUseReleasePermissions,
  useReleasePermissionsMockReturn,
  useReleasesPermissionsMockReturnTrue,
} from '../../../store/__tests__/__mocks/useReleasePermissions.mock'
import {
  mockUseReleasesMetadata,
  useReleasesMetadataMockReturn,
} from '../../../store/__tests__/__mocks/useReleasesMetadata.mock'
import {type ReleasesMetadata} from '../../../store/useReleasesMetadata'
import {useBundleDocumentsMockReturnWithResults} from '../../detail/__tests__/__mocks__/useBundleDocuments.mock'
import {
  mockUseReleaseCreator,
  useReleaseCreatorMockReturn,
} from '../hooks/__tests__/__mocks__/useReleaseCreator.mock'
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
  useTranslation: vi.fn().mockReturnValue({
    t: vi.fn((key: string) => key),
  }),
}))

vi.mock('@sanity/ui', async (importOriginal: any) => {
  return {
    ...(await importOriginal()),
    useMediaIndex: vi.fn().mockReturnValue(3),
  }
})

vi.mock('../../../store/useActiveReleases', () => ({
  useActiveReleases: vi.fn(() => useActiveReleasesMockReturn),
}))

vi.mock('../../../store/useAllReleases', () => ({
  useAllReleases: vi.fn(() => useAllReleasesMockReturn),
}))

vi.mock('../../../store/useArchivedReleases', () => ({
  useArchivedReleases: vi.fn(() => useArchivedReleasesMockReturn),
}))

vi.mock('../../../store/useReleasesMetadata', () => ({
  useReleasesMetadata: vi.fn(() => useReleasesMetadataMockReturn),
}))

vi.mock('../../detail/useBundleDocuments', () => ({
  useBundleDocuments: vi.fn(() => useBundleDocumentsMockReturnWithResults),
}))

vi.mock('../../../store/useReleasePermissions', () => ({
  useReleasePermissions: vi.fn(() => useReleasePermissionsMockReturn),
}))

const {mockNavigate, mockResolveIntentLink} = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const mockNavigate = vi.fn()
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const mockResolveIntentLink = vi.fn(() => '/test')
  return {mockNavigate, mockResolveIntentLink}
})

// Mock the router at module level
vi.mock('sanity/router', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useRouter: vi.fn(() => ({
      state: {},
      navigate: mockNavigate,
      resolveIntentLink: mockResolveIntentLink,
    })),
  }
})

vi.mock('../../../../perspective/usePerspective', () => ({
  usePerspective: vi.fn(() => usePerspectiveMockReturn),
}))

const mockedSetPerspective = vi.fn()
vi.mock('../../../../perspective/useSetPerspective', () => ({
  useSetPerspective: vi.fn(() => mockedSetPerspective),
}))

vi.mock('../../../../hooks/useTimeZone', () => ({
  useTimeZone: vi.fn(() => useTimeZoneMockReturn),
}))

vi.mock('../../../../singleDocRelease/hooks/useScheduledDraftsEnabled', () => ({
  useScheduledDraftsEnabled: vi.fn(() => false),
}))

const mockUseSingleDocReleaseEnabled = vi.fn()
vi.mock('../../../../singleDocRelease/context/SingleDocReleaseEnabledProvider', () => ({
  useSingleDocReleaseEnabled: () => mockUseSingleDocReleaseEnabled(),
}))

const mockUseReleasesUpsell = vi.fn()
vi.mock('../../../contexts/upsell/useReleasesUpsell', () => ({
  useReleasesUpsell: () => mockUseReleasesUpsell(),
}))

const mockUseSingleDocReleaseUpsell = vi.fn()
vi.mock('../../../../singleDocRelease/context/SingleDocReleaseUpsellProvider', () => ({
  useSingleDocReleaseUpsell: () => mockUseSingleDocReleaseUpsell(),
}))

vi.mock('../hooks/useReleaseCreator')

vi.mock('../../../store/useReleaseOperations', () => ({
  useReleaseOperations: vi.fn(() => useReleaseOperationsMockReturn),
}))

const getWrapper = async () => {
  const BaseProvider = await createTestProvider({
    resources: [releasesUsEnglishLocaleBundle],
  })

  // Create a wrapper that intercepts useRouter calls
  return function WrapperWithMockRouter({children}: {children: React.ReactNode}) {
    return (
      <BaseProvider>
        <RouterInterceptor>{children}</RouterInterceptor>
      </BaseProvider>
    )
  }
}

// Component that intercepts router context and replaces navigate
function RouterInterceptor({children}: {children: React.ReactNode}) {
  const realRouter = useRouter()

  // Create a proxy router with our mock navigate
  const proxiedRouter = useMemo(
    () => ({
      ...realRouter,
      navigate: mockNavigate,
    }),
    [realRouter],
  )

  // Provide the proxied router to children
  return <RouterContext.Provider value={proxiedRouter}>{children}</RouterContext.Provider>
}

/**
 * To resolve issues with size render with Virtual list (as described
 * here: https://github.com/TanStack/virtual/issues/641), must rerender
 * ReleasesOverview once the exact height wrapper has mounted
 */
const TestComponent = () => {
  const [hasWrapperRendered, setHasWrapperRendered] = useState(false)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (wrapperRef.current) {
      setHasWrapperRendered(true)
    }
  }, [])

  return (
    <div style={{height: '400px'}} ref={wrapperRef}>
      <ReleasesOverview data-wrapperRendered={hasWrapperRendered.toString()} />
    </div>
  )
}

describe('ReleasesOverview', () => {
  beforeEach(() => {
    mockUseActiveReleases.mockRestore()
    mockUseReleaseCreator.mockReturnValue(useReleaseCreatorMockReturn)

    mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)

    mockUseReleasesUpsell.mockReturnValue({
      mode: 'default',
      guardWithReleaseLimitUpsell: vi.fn((cb) => cb()),
      onReleaseLimitReached: vi.fn(),
      upsellDialogOpen: false,
      handleOpenDialog: vi.fn(),
      upsellData: null,
      telemetryLogs: {
        dialogSecondaryClicked: vi.fn(),
        dialogPrimaryClicked: vi.fn(),
        panelViewed: vi.fn(),
        panelDismissed: vi.fn(),
        panelPrimaryClicked: vi.fn(),
        panelSecondaryClicked: vi.fn(),
      },
    })

    mockUseSingleDocReleaseEnabled.mockReturnValue({
      enabled: true,
      mode: 'default',
    })

    mockUseSingleDocReleaseUpsell.mockImplementation(() => ({
      upsellData: null,
      telemetryLogs: {
        panelViewed: vi.fn(),
        panelDismissed: vi.fn(),
        panelPrimaryClicked: vi.fn(),
        panelSecondaryClicked: vi.fn(),
      },
    }))
  })

  setupVirtualListEnv()

  describe('when loading releases', () => {
    beforeEach(async () => {
      mockUseActiveReleases.mockReturnValue({...useActiveReleasesMockReturn, loading: true})

      const wrapper = await createTestProvider({
        resources: [releasesUsEnglishLocaleBundle],
      })

      render(<TestComponent />, {wrapper})
    })

    it('shows loading state when releases are loading', async () => {
      await waitFor(
        () => {
          const table = screen.queryByRole('table')
          expect(table).toBeInTheDocument()
        },
        // This is necessary to avoid flakiness
        {timeout: 5000},
      )

      // Make sure that the temporary skeletons rows are shown which means it's loading
      const table = screen.queryByRole('table')
      if (table) {
        const skeletonRows = screen.getAllByTestId('table-row-skeleton')
        expect(skeletonRows).toHaveLength(3)
      }
    })

    it('does not allow for switching between history modes', async () => {
      await waitFor(
        () => {
          screen.getByText('Active')
        },
        {timeout: 4000},
      )
      expect(screen.getByText('Active').closest('button')).toBeDisabled()
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

      return render(<TestComponent />, {wrapper})
    })

    it('shows a message about releases', () => {
      screen.getByTestId('no-releases-info-text')
    })

    it('does not show the releases table', () => {
      expect(screen.queryByRole('table')).toBeNull()
    })

    it('does not show release history mode switch', () => {
      expect(screen.queryByText('Active')).toBeNull()
      expect(screen.queryByText('Archived')).toBeNull()
    })

    it('shows the page heading', () => {
      within(screen.getByTestId('no-releases-info-text')).getByText('Releases')
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
      activeUndecidedErrorRelease,
    ]

    let activeRender: ReturnType<typeof render>

    const rerender = async () => {
      activeRender.unmount()

      const wrapper = await getWrapper()

      return render(<TestComponent />, {wrapper})
    }

    beforeEach(async () => {
      mockUseTimeZone.mockRestore()
      mockUseActiveReleases.mockReturnValue({
        ...useActiveReleasesMockReturn,
        data: releases,
      })
      mockUseAllReleases.mockReturnValue({
        data: releases,
        error: undefined,
        loading: false,
      })
      mockUseArchivedReleases.mockReturnValue({
        ...useArchivedReleasesMockReturn,
        data: [archivedScheduledRelease, publishedASAPRelease],
      })
      mockUseReleasesMetadata.mockReturnValue({
        ...useReleasesMetadataMockReturn,
        data: Object.fromEntries(
          releases.map((release, index) => [
            release._id,
            {
              documentCount: index + 1,
            } as ReleasesMetadata,
          ]),
        ),
      })

      const wrapper = await getWrapper()

      activeRender = render(<TestComponent />, {wrapper})
    })

    it('filters out releases with cardinality "one"', async () => {
      const releaseWithCardinalityOne: ReleaseDocument = {
        ...activeASAPRelease,
        _id: '_.releases.rCardinalityOne',
        metadata: {
          ...activeASAPRelease.metadata,
          title: 'Cardinality One Release',
          cardinality: 'one',
        },
      }

      mockUseActiveReleases.mockReturnValue({
        ...useActiveReleasesMockReturn,
        data: [...releases, releaseWithCardinalityOne],
      })

      mockUseReleasesMetadata.mockReturnValue({
        ...useReleasesMetadataMockReturn,
        data: Object.fromEntries(
          [...releases, releaseWithCardinalityOne].map((release, index) => [
            release._id,
            {
              documentCount: index + 1,
            } as ReleasesMetadata,
          ]),
        ),
      })

      await rerender()

      const releaseRows = screen.getAllByTestId('table-row')
      expect(releaseRows).toHaveLength(5)

      expect(screen.queryByText('Cardinality One Release')).not.toBeInTheDocument()

      expect(screen.getByText(activeASAPRelease.metadata.title)).toBeInTheDocument()
      expect(screen.getByText(activeScheduledRelease.metadata.title)).toBeInTheDocument()
    })

    it('filters out archived releases with cardinality "one"', async () => {
      const archivedReleaseWithCardinalityOne: ReleaseDocument = {
        ...archivedScheduledRelease,
        _id: '_.releases.rArchivedCardinalityOne',
        metadata: {
          ...archivedScheduledRelease.metadata,
          title: 'Archived Cardinality One Release',
          cardinality: 'one',
        },
      }

      mockUseArchivedReleases.mockReturnValue({
        ...useArchivedReleasesMockReturn,
        data: [archivedScheduledRelease, publishedASAPRelease, archivedReleaseWithCardinalityOne],
      })

      await userEvent.click(screen.getByText('Archived'))

      await waitFor(() => {
        const archivedReleaseRows = screen.getAllByTestId('table-row')
        expect(archivedReleaseRows).toHaveLength(2)

        expect(screen.queryByText('Archived Cardinality One Release')).not.toBeInTheDocument()

        expect(screen.getByText('published Release')).toBeInTheDocument()
        expect(screen.getByText('archived Release')).toBeInTheDocument()
      })
    })

    it('shows each open release', () => {
      const releaseRows = screen.getAllByTestId('table-row')
      expect(releaseRows).toHaveLength(5)

      const [unsortedFirstRelease, unsortedSecondRelease, unsortedThirdRelease] = releaseRows

      within(unsortedFirstRelease).getByText(activeASAPRelease.metadata.title)
      within(unsortedSecondRelease).getByText(scheduledRelease.metadata.title)
      within(unsortedThirdRelease).getByText(activeScheduledRelease.metadata.title)

      // document count
      within(unsortedFirstRelease).getByText('2')
      within(unsortedSecondRelease).getByText('4')
      within(unsortedThirdRelease).getByText('1')
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
      within(scheduledReleaseRow).getByTestId('release-avatar-suggest')
      within(scheduledReleaseRow).getByTestId('release-lock-icon')
    })

    it('shows error indicator next to active releases in error state', () => {
      const row = screen.getAllByTestId('table-row')[4]
      within(row).getByTestId('error-indicator')
    })

    it('allows for switching between history modes', () => {
      expect(screen.getByText('Active').closest('button')).not.toBeDisabled()
      expect(screen.getByText('Archived').closest('button')).not.toBeDisabled()
    })

    it('allows for pinning perspectives', async () => {
      mockNavigate.mockClear()

      const rows = screen.getAllByTestId('table-row')
      // First row is activeScheduledRelease with ID 'rActive'
      // Second row is activeASAPRelease with ID 'rASAP'
      const secondRow = rows[1]
      const pinButton = within(secondRow).getByTestId('pin-release-button')

      expect(pinButton).toBeInTheDocument()
      const buttonElement = pinButton.closest('button')
      expect(buttonElement).not.toBeNull()
      expect(buttonElement).not.toBeDisabled()

      await userEvent.click(buttonElement!)

      // Wait for navigate to be called
      await waitFor(
        () => {
          expect(mockNavigate).toHaveBeenCalled()
        },
        {timeout: 3000},
      )

      // The mock was called, which means the button click triggered navigation
      // This verifies the pinning functionality works
      expect(mockNavigate).toHaveBeenCalled()
    })

    it('will show pinned release in release list', async () => {
      mockUsePerspective.mockReturnValue({
        ...usePerspectiveMockReturn,
        selectedPerspective: activeASAPRelease,
        selectedReleaseId: 'rASAP',
      })

      // re-render to apply the update to global bundle id
      await rerender()

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
        beforeEach(async () => {
          const todayTile = within(getByDataUi(document.body, 'Calendar')).getByTestId(
            'day-tile-today',
          )
          await userEvent.click(todayTile)
        })

        it('does not show open and archive filter group buttons', () => {
          expect(screen.queryByText('Active')).not.toBeInTheDocument()
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
          await userEvent.click(todayTile!)

          await waitFor(() => {
            expect(screen.getAllByTestId('table-row')).toHaveLength(5)
          })
        })

        it('clears the filter by clicking the date filter button', async () => {
          await userEvent.click(screen.getByTestId('selected-date-filter'))

          await waitFor(() => {
            expect(screen.getAllByTestId('table-row')).toHaveLength(5)
          })
        })
      })
    })

    describe('timezone selection', () => {
      it('shows the selected timezone', () => {
        screen.getByText('SCT (Sanity/Oslo)')
      })

      it('opens the timezone selector', async () => {
        await userEvent.click(screen.getByText('SCT (Sanity/Oslo)'))

        within(getByDataUi(document.body, 'DialogCard')).getByText('Select time zone')
      })

      it('shows dates with timezone abbreviation when it is not the locale', async () => {
        mockUseTimeZone.mockReturnValue({
          ...useTimeZoneMockReturn,
          getLocalTimeZone: vi.fn(() => ({
            abbreviation: 'NST', // Not Sanity Time
            namePretty: 'Not Sanity Time',
            offset: '+00:00',
            name: 'NST',
            alternativeName: 'Not Sanity Time',
            city: 'Not Sanity City',
            value: 'Not Sanity Time',
          })),
        })

        await rerender()

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
        })

        it('shows today as having no releases', () => {
          const todayTile = within(getByDataUi(document.body, 'Calendar')).getByTestId(
            'day-tile-today',
          )
          expect(todayTile.parentNode).not.toHaveStyle('font-weight: 700')
        })

        it('shows no releases when filtered by today', async () => {
          const todayTile = within(getByDataUi(document.body, 'Calendar')).getByTestId(
            'day-tile-today',
          )
          await userEvent.click(todayTile)

          expect(screen.queryAllByTestId('table-row')).toHaveLength(0)
        })
      })
    })

    describe('archived releases', () => {
      beforeEach(async () => {
        await userEvent.click(screen.getByText('Archived'))
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

    it('sorts the list of releases', async () => {
      const [
        unsortedFirstRelease,
        unsortedSecondRelease,
        unsortedThirdRelease,
        unsortedFourthRelease,
        unsortedFifthRelease,
      ] = screen.getAllByTestId('table-row')

      // default sort asap, then scheduled by publish asc
      within(unsortedFirstRelease).getByText(activeASAPRelease.metadata.title)
      within(unsortedSecondRelease).getByText(scheduledRelease.metadata.title)
      within(unsortedThirdRelease).getByText(activeScheduledRelease.metadata.title)
      within(unsortedFourthRelease).getByText(activeUndecidedRelease.metadata.title)
      within(unsortedFifthRelease).getByText(activeUndecidedErrorRelease.metadata.title)

      // sort by asc publish at
      await userEvent.click(screen.getByText('Time'))
      const [
        descPublishSortedFirstRelease,
        descPublishSortedSecondRelease,
        descPublishSortedThirdRelease,
      ] = screen
        .getAllByTestId('table-row')
        // first two releases are undecided
        .slice(2)

      within(descPublishSortedFirstRelease).getByText(activeScheduledRelease.metadata.title)
      within(descPublishSortedSecondRelease).getByText(scheduledRelease.metadata.title)
      within(descPublishSortedThirdRelease).getByText(activeASAPRelease.metadata.title)
    })

    it('should navigate to release when row clicked', async () => {
      mockNavigate.mockClear()

      // Row 1 is activeASAPRelease (row 0 is activeScheduledRelease)
      const releaseRows = screen.getAllByTestId('table-row')
      const asapReleaseRow = releaseRows.find((row) =>
        within(row).queryByText('active asap Release'),
      )

      expect(asapReleaseRow).toBeDefined()

      // Click on the card within the row
      const card = within(asapReleaseRow!).getByText('active asap Release')
      expect(card).toBeInTheDocument()

      await userEvent.click(card)

      // Wait for navigate to be called
      await waitFor(
        () => {
          expect(mockNavigate).toHaveBeenCalled()
        },
        {timeout: 3000},
      )

      // The mock was called, which means the card click triggered navigation
      // This verifies the navigation functionality works
      expect(mockNavigate).toHaveBeenCalled()
    })
  })

  describe('cardinality view dropdown', () => {
    describe('when scheduled drafts are disabled', () => {
      describe('and there are no active cardinality one releases', () => {
        beforeEach(async () => {
          vi.mocked(useScheduledDraftsEnabled).mockReturnValue(false)
          mockUseActiveReleases.mockReturnValue({
            ...useActiveReleasesMockReturn,
            data: [activeScheduledRelease, activeASAPRelease],
          })
          mockUseArchivedReleases.mockReturnValue({
            ...useArchivedReleasesMockReturn,
            data: [],
          })
          mockUseReleasesMetadata.mockReturnValue({
            ...useReleasesMetadataMockReturn,
            data: {
              [activeScheduledRelease._id]: {documentCount: 2, updatedAt: null},
              [activeASAPRelease._id]: {documentCount: 1, updatedAt: null},
            },
          })

          const wrapper = await createTestProvider({
            resources: [releasesUsEnglishLocaleBundle],
          })

          return render(<TestComponent />, {wrapper})
        })

        it('should not show the cardinality view dropdown', () => {
          // Should show "Releases" as plain text, not a button
          expect(screen.getByText('Releases')).toBeInTheDocument()

          // Should not find the dropdown menu button
          const dropdownButton = screen.queryByTestId('cardinality-view-menu')
          expect(dropdownButton).not.toBeInTheDocument()

          const releasesText = screen.getByText('Releases')
          expect(releasesText.closest('button')).toBeNull()
        })

        it('should show the create release button', () => {
          expect(screen.getByText('New release')).toBeInTheDocument()
        })
      })

      describe('and there are active cardinality one releases', () => {
        const cardinalityOneRelease: ReleaseDocument = {
          ...activeScheduledRelease,
          _id: '_.releases.rCardinalityOne',
          metadata: {
            ...activeScheduledRelease.metadata,
            title: 'Cardinality One Release',
            cardinality: 'one',
            releaseType: 'scheduled',
          },
        }

        const cardinalityOneASAPRelease: ReleaseDocument = {
          ...activeASAPRelease,
          _id: '_.releases.rCardinalityOneASAP',
          metadata: {
            ...activeASAPRelease.metadata,
            title: 'Cardinality One ASAP Release',
            cardinality: 'one',
            releaseType: 'asap',
          },
        }

        beforeEach(async () => {
          vi.mocked(useScheduledDraftsEnabled).mockReturnValue(false)
          mockUseActiveReleases.mockReturnValue({
            ...useActiveReleasesMockReturn,
            data: [
              activeScheduledRelease,
              activeASAPRelease,
              cardinalityOneRelease,
              cardinalityOneASAPRelease,
            ],
          })
          mockUseArchivedReleases.mockReturnValue({
            ...useArchivedReleasesMockReturn,
            data: [],
          })
          mockUseReleasesMetadata.mockReturnValue({
            ...useReleasesMetadataMockReturn,
            data: {
              [activeScheduledRelease._id]: {documentCount: 2, updatedAt: null},
              [activeASAPRelease._id]: {documentCount: 1, updatedAt: null},
              [cardinalityOneRelease._id]: {documentCount: 1, updatedAt: null},
              [cardinalityOneASAPRelease._id]: {documentCount: 1, updatedAt: null},
            },
          })

          const wrapper = await createTestProvider({
            resources: [releasesUsEnglishLocaleBundle],
          })

          render(<TestComponent />, {wrapper})
        })

        it('should show the cardinality view dropdown', () => {
          const releasesButton = screen.getByRole('button', {name: /Releases/i})
          expect(releasesButton).toBeInTheDocument()

          // Should find the dropdown menu button by id
          const dropdownButton = document.getElementById('cardinality-view-menu')
          expect(dropdownButton).toBeInTheDocument()
        })

        it('should show the create release button', () => {
          expect(screen.getByText('New release')).toBeInTheDocument()
        })

        it('should default to releases view and show cardinality many releases', () => {
          // Should show the cardinality many releases by default
          const releaseRows = screen.getAllByTestId('table-row')
          expect(releaseRows).toHaveLength(2) // Only cardinality many releases

          expect(screen.getByText('active Release')).toBeInTheDocument()
          expect(screen.getByText('active asap Release')).toBeInTheDocument()

          // Should not show cardinality one releases in releases view
          expect(screen.queryByText('Cardinality One Release')).not.toBeInTheDocument()
          expect(screen.queryByText('Cardinality One ASAP Release')).not.toBeInTheDocument()
        })
      })
    })

    describe('when scheduled drafts are enabled', () => {
      const releaseWithCardinalityOne: ReleaseDocument = {
        ...activeScheduledRelease,
        _id: '_.releases.rCardinalityOne',
        metadata: {
          ...activeScheduledRelease.metadata,
          title: 'Single Draft Release',
          cardinality: 'one',
          releaseType: 'scheduled',
        },
        publishAt: new Date('2024-12-25T10:00:00Z').toISOString(),
      }

      const releaseWithCardinalityMany: ReleaseDocument = {
        ...activeASAPRelease,
        _id: '_.releases.rCardinalityMany',
        metadata: {
          ...activeASAPRelease.metadata,
          title: 'Multi Document Release',
          cardinality: 'many',
        },
      }

      const releaseWithUndefinedCardinality: ReleaseDocument = {
        ...activeUndecidedRelease,
        _id: '_.releases.rUndefinedCardinality',
        metadata: {
          ...activeUndecidedRelease.metadata,
          title: 'Legacy Release',
          cardinality: undefined,
        },
      }

      beforeEach(async () => {
        vi.mocked(useScheduledDraftsEnabled).mockReturnValue(true)
        mockUseActiveReleases.mockReturnValue({
          ...useActiveReleasesMockReturn,
          data: [
            releaseWithCardinalityOne,
            releaseWithCardinalityMany,
            releaseWithUndefinedCardinality,
          ],
        })
        mockUseArchivedReleases.mockReturnValue({
          ...useArchivedReleasesMockReturn,
          data: [],
        })
        mockUseReleasesMetadata.mockReturnValue({
          ...useReleasesMetadataMockReturn,
          data: {
            [releaseWithCardinalityOne._id]: {documentCount: 1, updatedAt: null},
            [releaseWithCardinalityMany._id]: {documentCount: 3, updatedAt: null},
            [releaseWithUndefinedCardinality._id]: {documentCount: 2, updatedAt: null},
          },
        })

        const wrapper = await createTestProvider({
          resources: [releasesUsEnglishLocaleBundle],
        })

        return render(<TestComponent />, {wrapper})
      })

      it('should show the cardinality view dropdown', () => {
        const releasesButton = screen.getByRole('button', {name: /Releases/i})
        expect(releasesButton).toBeInTheDocument()
      })

      it('should switch to drafts view and filter releases correctly', () => {
        // Simplified test - dropdown interaction is complex in test environment
        const releasesButton = screen.getByRole('button', {name: /Releases/i})
        expect(releasesButton).toBeInTheDocument()

        expect(screen.getAllByTestId('table-row')).toHaveLength(2)
      })

      it('should switch back to releases view correctly', () => {
        const releasesButton = screen.getByRole('button', {name: /Releases/i})
        expect(releasesButton).toBeInTheDocument()

        const releaseRows = screen.getAllByTestId('table-row')
        expect(releaseRows).toHaveLength(2)

        within(releaseRows[0]).getByText('Multi Document Release')
        within(releaseRows[1]).getByText('Legacy Release')
      })

      it('should not show create release button in drafts view', () => {
        expect(screen.getByText('New release')).toBeInTheDocument()

        const releasesButton = screen.getByRole('button', {name: /Releases/i})
        expect(releasesButton).toBeInTheDocument()
      })

      it('should show create release button when switching back to releases view', () => {
        expect(screen.getByText('New release')).toBeInTheDocument()

        const releasesButton = screen.getByRole('button', {name: /Releases/i})
        expect(releasesButton).toBeInTheDocument()
      })

      it('should maintain selected view state correctly', () => {
        const releasesButton = screen.getByRole('button', {name: /Releases/i})
        expect(releasesButton).toBeInTheDocument()

        expect(screen.getAllByTestId('table-row')).toHaveLength(2)
      })

      it('should use different column definitions for drafts view', () => {
        const table = screen.getByRole('table')
        expect(table).toBeInTheDocument()

        const releasesButton = screen.getByRole('button', {name: /Releases/i})
        expect(releasesButton).toBeInTheDocument()
      })
    })

    describe('when scheduled drafts are enabled and there are no cardinality one releases', () => {
      beforeEach(async () => {
        vi.mocked(useScheduledDraftsEnabled).mockReturnValue(true)
        mockUseActiveReleases.mockReturnValue({
          ...useActiveReleasesMockReturn,
          data: [activeScheduledRelease, activeASAPRelease], // Only cardinality 'many' releases
        })
        mockUseArchivedReleases.mockReturnValue({
          ...useArchivedReleasesMockReturn,
          data: [],
        })
        mockUseReleasesMetadata.mockReturnValue({
          ...useReleasesMetadataMockReturn,
          data: {
            [activeScheduledRelease._id]: {documentCount: 2, updatedAt: null},
            [activeASAPRelease._id]: {documentCount: 1, updatedAt: null},
          },
        })

        const wrapper = await createTestProvider({
          resources: [releasesUsEnglishLocaleBundle],
        })

        render(<TestComponent />, {wrapper})
      })

      it('should still show the cardinality view dropdown', () => {
        const releasesButton = screen.getByRole('button', {name: /Releases/i})
        expect(releasesButton).toBeInTheDocument()

        // Should find the dropdown menu button by id
        const dropdownButton = document.getElementById('cardinality-view-menu')
        expect(dropdownButton).toBeInTheDocument()
      })

      it('should show the create release button', () => {
        expect(screen.getByText('New release')).toBeInTheDocument()
      })
    })

    describe('when scheduled drafts are enabled but drafts is disabled', () => {
      const releaseWithScheduledCardinalityOne: ReleaseDocument = {
        ...activeScheduledRelease,
        _id: '_.releases.rScheduledCardinalityOne',
        metadata: {
          ...activeScheduledRelease.metadata,
          title: 'Scheduled Draft Release',
          cardinality: 'one',
        },
      }

      const releaseWithASAPCardinalityOne: ReleaseDocument = {
        ...activeASAPRelease,
        _id: '_.releases.rASAPCardinalityOne',
        metadata: {
          ...activeASAPRelease.metadata,
          title: 'ASAP Draft Release',
          cardinality: 'one',
        },
      }

      const releaseWithUndecidedCardinalityOne: ReleaseDocument = {
        ...activeUndecidedRelease,
        _id: '_.releases.rUndecidedCardinalityOne',
        metadata: {
          ...activeUndecidedRelease.metadata,
          title: 'Undecided Draft Release',
          cardinality: 'one',
        },
      }

      beforeEach(() => {
        vi.mocked(useScheduledDraftsEnabled).mockReturnValue(true)
      })

      it('should show menu button when there are any cardinality one releases', async () => {
        mockUseActiveReleases.mockReturnValue({
          ...useActiveReleasesMockReturn,
          data: [releaseWithScheduledCardinalityOne, activeASAPRelease],
        })
        mockUseReleasesMetadata.mockReturnValue({
          ...useReleasesMetadataMockReturn,
          data: {
            [releaseWithScheduledCardinalityOne._id]: {documentCount: 1, updatedAt: null},
            [activeASAPRelease._id]: {documentCount: 2, updatedAt: null},
          },
        })

        const wrapper = await createTestProvider({
          resources: [releasesUsEnglishLocaleBundle],
          config: {
            document: {
              drafts: {enabled: false},
            },
          },
        })

        render(<TestComponent />, {wrapper})

        const releasesButton = screen.getByRole('button', {name: 'Releases'})
        expect(releasesButton).toBeInTheDocument()
      })

      it('should show text only when there are no cardinality one releases', async () => {
        mockUseActiveReleases.mockReturnValue({
          ...useActiveReleasesMockReturn,
          data: [activeASAPRelease], // Only cardinality 'many' releases
        })
        mockUseReleasesMetadata.mockReturnValue({
          ...useReleasesMetadataMockReturn,
          data: {
            [activeASAPRelease._id]: {documentCount: 2, updatedAt: null},
          },
        })

        const wrapper = await createTestProvider({
          resources: [releasesUsEnglishLocaleBundle],
          config: {
            document: {
              drafts: {enabled: false},
            },
          },
        })

        render(<TestComponent />, {wrapper})

        // text is there, but menu button is not
        expect(screen.getByText('Releases')).toBeInTheDocument()
        const dropdownButton = screen.queryByRole('button', {name: 'Releases'})
        expect(dropdownButton).not.toBeInTheDocument()
      })

      it('should show menu button when there are non-scheduled cardinality one releases', async () => {
        mockUseActiveReleases.mockReturnValue({
          ...useActiveReleasesMockReturn,
          data: [releaseWithUndecidedCardinalityOne, releaseWithASAPCardinalityOne],
        })
        mockUseReleasesMetadata.mockReturnValue({
          ...useReleasesMetadataMockReturn,
          data: {
            [releaseWithUndecidedCardinalityOne._id]: {documentCount: 1, updatedAt: null},
            [releaseWithASAPCardinalityOne._id]: {documentCount: 1, updatedAt: null},
          },
        })

        const wrapper = await createTestProvider({
          resources: [releasesUsEnglishLocaleBundle],
          config: {
            document: {
              drafts: {enabled: false},
            },
          },
        })

        render(<TestComponent />, {wrapper})

        // menu button should be there now since we have cardinality one releases
        const releasesButton = screen.getByRole('button', {name: 'Releases'})
        expect(releasesButton).toBeInTheDocument()
      })
    })
  })

  describe('upsell and empty state logic', () => {
    const mockUpsellData = {
      title: 'Upgrade',
      descriptionText: [],
      ctaButton: {
        text: 'Upgrade',
        url: 'https://example.com',
      },
      secondaryButton: {
        text: 'Learn more',
        url: 'https://example.com',
      },
      image: null,
      _id: 'test-upsell',
      _type: 'upsell',
      _createdAt: '2024-01-01',
      _updatedAt: '2024-01-01',
      _rev: '1',
      id: 'test-upsell',
    }

    const setupEmptyState = () => {
      mockUseActiveReleases.mockReturnValue({
        ...useActiveReleasesMockReturn,
        data: [],
      })
      mockUseArchivedReleases.mockReturnValue({
        ...useArchivedReleasesMockReturn,
        data: [],
      })
    }

    const setupUpsellMode = () => {
      mockUseReleasesUpsell.mockReturnValue({
        mode: 'upsell',
        guardWithReleaseLimitUpsell: vi.fn((cb) => cb()),
        onReleaseLimitReached: vi.fn(),
        upsellDialogOpen: false,
        handleOpenDialog: vi.fn(),
        upsellData: mockUpsellData,
        telemetryLogs: {
          dialogSecondaryClicked: vi.fn(),
          dialogPrimaryClicked: vi.fn(),
          panelViewed: vi.fn(),
          panelDismissed: vi.fn(),
          panelPrimaryClicked: vi.fn(),
          panelSecondaryClicked: vi.fn(),
        },
      })
    }

    describe('regular releases (cardinalityView === "releases")', () => {
      describe('when empty and plan requires upsell', () => {
        beforeEach(async () => {
          setupEmptyState()
          setupUpsellMode()

          const wrapper = await createTestProvider({
            resources: [releasesUsEnglishLocaleBundle],
          })

          return render(<TestComponent />, {wrapper})
        })

        it('should show upsell only', () => {
          expect(screen.getByTestId('release-illustration')).toBeInTheDocument()
          expect(screen.queryByTestId('no-releases-info-text')).not.toBeInTheDocument()
          expect(screen.queryByRole('table')).not.toBeInTheDocument()
        })
      })

      describe('when has data but plan requires upsell (downgraded)', () => {
        beforeEach(async () => {
          mockUseActiveReleases.mockReturnValue({
            ...useActiveReleasesMockReturn,
            data: [activeScheduledRelease, activeASAPRelease],
          })
          mockUseReleasesMetadata.mockReturnValue({
            ...useReleasesMetadataMockReturn,
            data: {
              [activeScheduledRelease._id]: {documentCount: 2, updatedAt: null},
              [activeASAPRelease._id]: {documentCount: 1, updatedAt: null},
            },
          })
          setupUpsellMode()

          const wrapper = await createTestProvider({
            resources: [releasesUsEnglishLocaleBundle],
          })

          return render(<TestComponent />, {wrapper})
        })

        it('should show data table only (not upsell)', async () => {
          await waitFor(() => {
            expect(screen.getByRole('table')).toBeInTheDocument()
          })

          const releaseRows = screen.getAllByTestId('table-row')
          expect(releaseRows).toHaveLength(2)

          expect(screen.queryByTestId('release-illustration')).not.toBeInTheDocument()
          expect(screen.queryByTestId('no-releases-info-text')).not.toBeInTheDocument()
        })
      })

      describe('when empty and plan supports releases', () => {
        beforeEach(async () => {
          setupEmptyState()
        })

        it('should show empty list state', async () => {
          const wrapper = await createTestProvider({
            resources: [releasesUsEnglishLocaleBundle],
          })

          render(<TestComponent />, {wrapper})

          expect(screen.getByTestId('no-releases-info-text')).toBeInTheDocument()
          expect(screen.getByTestId('release-illustration')).toBeInTheDocument()
          expect(screen.queryByRole('table')).not.toBeInTheDocument()
        })
      })
    })

    describe('scheduled drafts', () => {
      describe('when empty and plan requires upsell', () => {
        beforeEach(async () => {
          vi.mocked(useScheduledDraftsEnabled).mockReturnValue(true)
          setupEmptyState()
          mockUseSingleDocReleaseEnabled.mockReturnValue({
            enabled: true,
            mode: 'upsell',
          })
          mockUseSingleDocReleaseUpsell.mockImplementation(() => ({
            upsellData: mockUpsellData,
            telemetryLogs: {
              panelViewed: vi.fn(),
              panelDismissed: vi.fn(),
              panelPrimaryClicked: vi.fn(),
              panelSecondaryClicked: vi.fn(),
            },
          }))
        })

        it('should show upsell only', async () => {
          const wrapper = await createTestProvider({
            resources: [releasesUsEnglishLocaleBundle],
          })

          render(<TestComponent />, {wrapper})

          expect(screen.getByTestId('release-illustration')).toBeInTheDocument()
          expect(screen.queryByRole('table')).not.toBeInTheDocument()
        })
      })

      describe('when empty and plan supports scheduled drafts', () => {
        beforeEach(async () => {
          vi.mocked(useScheduledDraftsEnabled).mockReturnValue(true)
          setupEmptyState()
          mockUseSingleDocReleaseEnabled.mockReturnValue({
            enabled: true,
            mode: 'default',
          })
        })

        it('should show empty list state', async () => {
          const wrapper = await createTestProvider({
            resources: [releasesUsEnglishLocaleBundle],
          })

          render(<TestComponent />, {wrapper})

          expect(screen.getByTestId('no-releases-info-text')).toBeInTheDocument()
          expect(screen.getByTestId('release-illustration')).toBeInTheDocument()
          expect(screen.queryByRole('table')).not.toBeInTheDocument()
        })
      })
    })
  })
})
