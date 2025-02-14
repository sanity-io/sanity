import {fireEvent, render, type RenderResult, screen, waitFor, within} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {useExcludedPerspectiveMockReturn} from '../../../perspective/__mocks__/useExcludedPerspective.mock'
import {usePerspectiveMockReturn} from '../../../perspective/__mocks__/usePerspective.mock'
import {
  activeASAPRelease,
  activeScheduledRelease,
  scheduledRelease,
} from '../../../releases/__fixtures__/release.fixture'
import {useReleasesUpsellMockReturn} from '../../../releases/contexts/upsell/__mocks__/useReleasesUpsell.mock'
import {useActiveReleasesMockReturn} from '../../../releases/store/__tests__/__mocks/useActiveReleases.mock'
import {
  mockUseReleasePermissions,
  useReleasePermissionsMockReturn,
} from '../../../releases/store/__tests__/__mocks/useReleasePermissions.mock'
import {LATEST} from '../../../releases/util/const'
import {ReleasesNav} from '../ReleasesNav'

vi.mock('../../../releases/store/useReleasePermissions', () => ({
  useReleasePermissions: vi.fn(() => useReleasePermissionsMockReturn),
}))

vi.mock('../../../releases/contexts/upsell/useReleasesUpsell', () => ({
  useReleasesUpsell: vi.fn(() => useReleasesUpsellMockReturn),
}))

vi.mock('../../../perspective/usePerspective', () => ({
  usePerspective: vi.fn(() => usePerspectiveMockReturn),
}))

vi.mock('../../../perspective/useExcludedPerspective', () => ({
  useExcludedPerspective: vi.fn(() => useExcludedPerspectiveMockReturn),
}))

const mockedSetPerspective = vi.fn()
vi.mock('../../../perspective/useSetPerspective', () => ({
  useSetPerspective: vi.fn(() => mockedSetPerspective),
}))

vi.mock('../../../releases/store/useActiveReleases', () => ({
  useActiveReleases: vi.fn(() => useActiveReleasesMockReturn),
}))

const mockedUseWorkspace = vi.fn()
vi.mock('../../../studio/useWorkspace', () => ({
  useWorkspace: vi.fn(() => mockedUseWorkspace),
}))

vi.mock('sanity/router', async (importOriginal) => ({
  ...(await importOriginal()),
  IntentLink: vi.fn().mockImplementation((props) => <a {...props} />),
  useRouterState: vi.fn().mockReturnValue(undefined),
}))

let currentRenderedInstance: RenderResult<any, any, any> | undefined

const renderTest = async () => {
  const wrapper = await createTestProvider({
    resources: [],
  })
  currentRenderedInstance = render(<ReleasesNav />, {wrapper})

  return currentRenderedInstance
}

describe('ReleasesNav', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseReleasePermissions.mockReturnValue({
      checkWithPermissionGuard: async () => true,
    })
  })
  it('should have link to releases tool', async () => {
    await renderTest()

    const releasesLink = screen.getByRole('link')

    expect(releasesLink).toHaveAttribute('href', '/')
    expect(releasesLink).not.toHaveAttribute('data-selected')
  })

  it('should have dropdown menu for global perspectives', async () => {
    await renderTest()

    screen.getByTestId('global-perspective-menu-button')
  })

  it('should not have clear button when no perspective is chosen', async () => {
    await renderTest()

    expect(screen.queryByTestId('clear-perspective-button')).toBeNull()
  })

  it('should have clear button to unset perspective when a perspective is chosen', async () => {
    usePerspectiveMockReturn.selectedPerspective = activeScheduledRelease
    usePerspectiveMockReturn.selectedReleaseId = 'rActive'

    await renderTest()

    fireEvent.click(screen.getByTestId('clear-perspective-button'))

    expect(mockedSetPerspective).toHaveBeenCalledWith(LATEST)
  })

  it('should list the title of the chosen perspective', async () => {
    usePerspectiveMockReturn.selectedPerspective = activeScheduledRelease
    usePerspectiveMockReturn.selectedReleaseId = 'rActive'

    await renderTest()

    screen.getByText('active Release')
  })

  it('should show release avatar for chosen perspective', async () => {
    usePerspectiveMockReturn.selectedPerspective = activeASAPRelease
    usePerspectiveMockReturn.selectedReleaseId = 'rActive'

    await renderTest()

    screen.getByTestId('release-avatar-critical')
  })

  describe('global perspective menu', () => {
    const renderAndWaitForStableMenu = async () => {
      await renderTest()

      fireEvent.click(screen.getByTestId('global-perspective-menu-button'))

      await waitFor(() => {
        expect(screen.queryByTestId('spinner')).toBeNull()
      })
    }

    beforeEach(async () => {
      useActiveReleasesMockReturn.data = [
        activeScheduledRelease,
        {
          ...activeScheduledRelease,
          _id: '_.releases.rScheduled2',
          metadata: {...activeScheduledRelease.metadata, title: 'active Scheduled 2'},
        },
        activeASAPRelease,

        {...scheduledRelease, publishAt: '2023-10-10T09:00:00Z'},
      ]
    })

    describe('when menu is ready', () => {
      beforeEach(renderAndWaitForStableMenu)

      it('should show published perspective item', async () => {
        within(screen.getByTestId('release-menu')).getByText('Published')

        fireEvent.click(screen.getByText('Published'))

        expect(mockedSetPerspective).toHaveBeenCalledWith('published')
      })

      it('should list all the releases', async () => {
        const releaseMenu = within(screen.getByTestId('release-menu'))

        // section titles
        releaseMenu.getByText('ASAP')
        releaseMenu.getByText('At time')
        expect(releaseMenu.queryByText('Undecided')).toBeNull()

        // releases
        releaseMenu.getByText('active Release')
        releaseMenu.getByText('active Scheduled 2')
        releaseMenu.getByText('active asap Release')
        releaseMenu.getByText('scheduled Release')
      })

      it('should show the intended release date for intended schedule releases', async () => {
        const scheduledMenuItem = within(screen.getByTestId('release-menu'))
          .getByText('active Scheduled 2')
          .closest('button')!

        within(scheduledMenuItem).getByText(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/)
        within(scheduledMenuItem).getByTestId('release-avatar-primary')
      })

      it('should show the actual release date for a scheduled release', async () => {
        const scheduledMenuItem = within(screen.getByTestId('release-menu'))
          .getByText('scheduled Release')
          .closest('button')!

        within(scheduledMenuItem).getByText(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/)
        within(scheduledMenuItem).getByTestId('release-lock-icon')
        within(scheduledMenuItem).getByTestId('release-avatar-primary')
      })

      it('allows for new release to be created', async () => {
        fireEvent.click(screen.getByText('New release'))

        expect(screen.getByRole('dialog')).toHaveAttribute('id', 'create-release-dialog')
      })

      it('disables button when no permissions are met', async () => {
        mockUseReleasePermissions.mockReturnValue({
          checkWithPermissionGuard: async () => true,
        })
      })
    })

    describe('release layering', () => {
      beforeEach(() => {
        // since usePerspective is mocked, and the layering exclude toggle is
        // controlled by currentGlobalBundleId, we need to manually set it
        // to the release that will be selected in below tests
        usePerspectiveMockReturn.selectedReleaseId = 'rScheduled2'
        // add an undecided release to expand testing
        useActiveReleasesMockReturn.data = [
          ...useActiveReleasesMockReturn.data,
          {
            ...activeASAPRelease,
            _id: '_.releases.rUndecided',
            metadata: {
              ...activeASAPRelease.metadata,
              title: 'undecided Release',
              releaseType: 'undecided',
            },
          },
        ]
      })

      describe('when a release is clicked', () => {
        beforeEach(async () => {
          await renderAndWaitForStableMenu()

          // select a release that has some other nested layer releases
          fireEvent.click(screen.getByText('active Scheduled 2'))
        })

        it('should set a given perspective from the menu', async () => {
          expect(mockedSetPerspective).toHaveBeenCalledWith('rScheduled2')
        })

        it('should allow for hiding of any deeper layered releases', async () => {
          const deepLayerRelease = within(screen.getByTestId('release-menu'))
            .getByText('active Release')
            .closest('button')!

          // toggle to hide
          fireEvent.click(within(deepLayerRelease).getByTestId('release-toggle-visibility'))
          expect(useExcludedPerspectiveMockReturn.toggleExcludedPerspective).toHaveBeenCalledWith(
            'rActive',
          )

          // toggle to include
          fireEvent.click(within(deepLayerRelease).getByTestId('release-toggle-visibility'))
          expect(useExcludedPerspectiveMockReturn.toggleExcludedPerspective).toHaveBeenCalledWith(
            'rActive',
          )
        })

        it('should not allow for hiding of published perspective', async () => {
          const publishedRelease = within(screen.getByTestId('release-menu'))
            .getByText('Published')
            .closest('button')!

          expect(
            within(publishedRelease).queryByTestId('release-toggle-visibility'),
          ).not.toBeInTheDocument()
        })

        it('should allow for hiding of draft perspective', async () => {
          const drafts = within(screen.getByTestId('release-menu'))
            .getByText('Drafts')
            .closest('button')!

          expect(within(drafts).queryByTestId('release-toggle-visibility')).toBeInTheDocument()
          // toggle to hide
          fireEvent.click(within(drafts).getByTestId('release-toggle-visibility'))
          expect(useExcludedPerspectiveMockReturn.toggleExcludedPerspective).toHaveBeenCalledWith(
            'drafts',
          )
          // toggle to include
          fireEvent.click(within(drafts).getByTestId('release-toggle-visibility'))
          expect(useExcludedPerspectiveMockReturn.toggleExcludedPerspective).toHaveBeenCalledWith(
            'drafts',
          )
        })

        it('should not allow hiding of the current perspective', async () => {
          const currentRelease = within(screen.getByTestId('release-menu'))
            .getByText('active Scheduled 2')
            .closest('button')!

          expect(
            within(currentRelease).queryByTestId('release-toggle-visibility'),
          ).not.toBeInTheDocument()
        })

        it('should not allow hiding of un-nested releases', async () => {
          const unNestedRelease = within(screen.getByTestId('release-menu'))
            .getByText('undecided Release')
            .closest('button')!

          expect(
            within(unNestedRelease).queryByTestId('release-toggle-visibility'),
          ).not.toBeInTheDocument()
        })

        it('should not allow hiding of locked in scheduled releases', async () => {
          const scheduledReleaseMenuItem = within(screen.getByTestId('release-menu'))
            .getByText('scheduled Release')
            .closest('button')!

          expect(
            within(scheduledReleaseMenuItem).queryByTestId('release-toggle-visibility'),
          ).not.toBeInTheDocument()
        })
      })

      it('applies existing layering when opened', async () => {
        useExcludedPerspectiveMockReturn.isPerspectiveExcluded.mockImplementation((id) => {
          return id === 'rActive'
        })

        await renderAndWaitForStableMenu()

        const activeReleaseMenuItem = within(screen.getByTestId('release-menu'))
          .getByText('active Release')
          .closest('button')!

        expect(
          within(activeReleaseMenuItem).queryByTestId('release-avatar-primary'),
        ).not.toBeInTheDocument()
      })

      describe('when releases are disabled', () => {
        beforeEach(() => {
          mockedUseWorkspace.mockReturnValue({releases: {enabled: false}})
        })

        it('should hide calendar icon', async () => {
          expect(screen.queryByTestId('releases-tool-link')).toBeNull()
        })
      })
    })
  })
})
