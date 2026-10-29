import {render, type RenderResult, screen, waitFor, within} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {useExcludedPerspectiveMockReturn} from '../../../perspective/__mocks__/useExcludedPerspective.mock'
import {usePerspectiveMockReturn} from '../../../perspective/__mocks__/usePerspective.mock'
import {
  activeASAPErrorRelease,
  activeASAPRelease,
  activeScheduledRelease,
  scheduledRelease,
} from '../../../releases/__fixtures__/release.fixture'
import {useReleasesUpsellMockReturn} from '../../../releases/contexts/upsell/__mocks__/useReleasesUpsell.mock'
import {useActiveReleasesMockReturn} from '../../../releases/store/__tests__/__mocks/useActiveReleases.mock'
import {
  mockUseReleasePermissions,
  useReleasePermissionsMockReturn,
  useReleasesPermissionsMockReturnTrue,
} from '../../../releases/store/__tests__/__mocks/useReleasePermissions.mock'
import {ReleasesNav} from '../releases/ReleasesNav'

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

const mockUseGetDefaultPerspective = vi.hoisted(() =>
  vi.fn(() => 'drafts' as 'drafts' | 'published'),
)
vi.mock('../../useGetDefaultPerspective', () => ({
  useGetDefaultPerspective: mockUseGetDefaultPerspective,
}))

vi.mock('../../../releases/store/useActiveReleases', () => ({
  useActiveReleases: vi.fn(() => useActiveReleasesMockReturn),
}))

vi.mock('../releases/ViewContentReleasesMenuItem', () => ({
  ViewContentReleasesMenuItem: () => null,
}))

vi.mock('../releases/ScheduledDraftsMenuItem', () => ({
  ScheduledDraftsMenuItem: () => null,
}))

const mockedUseWorkspace = vi.fn()
vi.mock('../../../studio/useWorkspace', () => ({
  useWorkspace: vi.fn(() => mockedUseWorkspace),
}))

vi.mock('sanity/router', async (importOriginal) => ({
  ...(await importOriginal()),
  IntentLink: vi
    .fn()
    .mockImplementation(
      ({intent, params: _params, replace: _replace, searchParams: _searchParams, ...rest}) => (
        <a href={`/intent/${intent}`} {...rest} />
      ),
    ),
  StateLink: vi.fn().mockImplementation(({state, children, ...rest}) => (
    <a href="/" {...rest}>
      {children}
    </a>
  )),
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

    mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)
    mockUseGetDefaultPerspective.mockReturnValue('drafts')
    usePerspectiveMockReturn.selectedPerspective = 'drafts'
    usePerspectiveMockReturn.selectedPerspectiveName = undefined
  })

  it('shows the drafts label when no perspective is chosen', async () => {
    await renderTest()

    screen.getByRole('button', {name: 'Drafts'})
  })

  it('should have dropdown menu for global perspectives', async () => {
    await renderTest()

    screen.getByTestId('global-perspective-menu-button')
  })

  it('should not have clear button when no perspective is chosen', async () => {
    await renderTest()

    expect(screen.queryByTestId('global-perspective-button-clear')).toBeNull()
  })

  it('hides the clear control when published is the default perspective', async () => {
    mockUseGetDefaultPerspective.mockReturnValue('published')
    usePerspectiveMockReturn.selectedPerspective = 'published'
    usePerspectiveMockReturn.selectedPerspectiveName = 'published'

    await renderTest()

    expect(screen.queryByTestId('global-perspective-button-clear')).toBeNull()
  })

  it('shows the clear control when published is selected and drafts are the default', async () => {
    usePerspectiveMockReturn.selectedPerspective = 'published'
    usePerspectiveMockReturn.selectedPerspectiveName = 'published'

    await renderTest()

    expect(screen.getByTestId('global-perspective-button-clear')).toBeInTheDocument()
  })

  it('should list the title of the chosen perspective', async () => {
    usePerspectiveMockReturn.selectedPerspective = activeScheduledRelease
    usePerspectiveMockReturn.selectedPerspectiveName = 'rActive'

    await renderTest()

    screen.getByText('active Release')
  })

  it('clears a chosen perspective', async () => {
    usePerspectiveMockReturn.selectedPerspective = activeScheduledRelease
    usePerspectiveMockReturn.selectedPerspectiveName = 'rActive'

    await renderTest()

    await userEvent.click(screen.getByTestId('global-perspective-button-clear'))

    expect(mockedSetPerspective).toHaveBeenCalledWith(undefined)
  })

  it('truncates a long release title and keeps the full title in a tooltip', async () => {
    const longTitle = 'A'.repeat(60)
    usePerspectiveMockReturn.selectedPerspective = {
      ...activeScheduledRelease,
      metadata: {...activeScheduledRelease.metadata, title: longTitle},
    }
    usePerspectiveMockReturn.selectedPerspectiveName = 'rActive'

    await renderTest()

    const truncated = `${'A'.repeat(50)}\u2026`
    screen.getByText(truncated)
    screen.getByRole('button', {name: longTitle})
    screen.getByText(longTitle)
  })

  describe('global perspective menu', () => {
    const renderAndWaitForStableMenu = async () => {
      await renderTest()

      await userEvent.click(screen.getByTestId('global-perspective-menu-button'))

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
        activeASAPErrorRelease,
      ]
    })

    describe('when menu is ready', () => {
      beforeEach(renderAndWaitForStableMenu)

      it('should show published perspective item', async () => {
        within(screen.getByTestId('release-menu')).getByText('Published')

        await userEvent.click(screen.getByText('Published'))

        expect(mockedSetPerspective).toHaveBeenCalledWith('published')
      })

      it('should list all the releases', async () => {
        const releaseMenu = within(screen.getByTestId('release-menu'))

        // section titles
        releaseMenu.getByText('As soon as possible')
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
        within(scheduledMenuItem).getByTestId('release-avatar-suggest')
      })

      it('should show the actual release date for a scheduled release', async () => {
        const scheduledMenuItem = within(screen.getByTestId('release-menu'))
          .getByText('scheduled Release')
          .closest('button')!

        within(scheduledMenuItem).getByText(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/)
        within(scheduledMenuItem).getByTestId('release-lock-icon')
        within(scheduledMenuItem).getByTestId('release-avatar-suggest')
      })

      it('should show the error icon if the release is active and has an error', () => {
        const releaseMenu = screen.getByTestId('release-menu')
        const releaseTitle = within(releaseMenu).getByText('active asap Error Release')
        const releaseButton = releaseTitle?.closest('button')

        expect(releaseButton).toBeTruthy()
        within(releaseButton!).getByTestId('release-error-icon')
      })

      it('allows for new release to be created', async () => {
        await userEvent.click(screen.getByText('New release'))

        expect(screen.getByRole('dialog')).toHaveAttribute('id', 'create-release-dialog')
      })

      it('disables button when no permissions are met', async () => {
        mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)
      })
    })

    describe('release layering', () => {
      beforeEach(() => {
        // since usePerspective is mocked, and the layering exclude toggle is
        // controlled by the selected release, set both the name and the document.
        // Drafts can only be hidden while the selected perspective is a release.
        usePerspectiveMockReturn.selectedPerspectiveName = 'rScheduled2'
        usePerspectiveMockReturn.selectedPerspective = activeScheduledRelease
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
        const prerenderTest = async () => {
          await renderAndWaitForStableMenu()

          // select a release that has some other nested layer releases
          await userEvent.click(screen.getByText('active Scheduled 2'))
        }

        it('should set a given perspective from the menu', async () => {
          await prerenderTest()

          expect(mockedSetPerspective).toHaveBeenCalledWith('rScheduled2')
        })

        it('should allow for hiding of any deeper layered releases', async () => {
          await prerenderTest()

          const deepLayerRelease = within(screen.getByTestId('release-menu'))
            .getByText('active Release')
            .closest('button')!

          // toggle to hide
          await userEvent.click(within(deepLayerRelease).getByTestId('release-toggle-visibility'))
          expect(useExcludedPerspectiveMockReturn.toggleExcludedPerspective).toHaveBeenCalledWith(
            'rActive',
          )

          // toggle to include
          await userEvent.click(within(deepLayerRelease).getByTestId('release-toggle-visibility'))
          expect(useExcludedPerspectiveMockReturn.toggleExcludedPerspective).toHaveBeenCalledWith(
            'rActive',
          )
        })

        it('should not allow for hiding of published perspective', async () => {
          await prerenderTest()

          const publishedRelease = within(screen.getByTestId('release-menu'))
            .getByText('Published')
            .closest('button')!

          expect(
            within(publishedRelease).queryByTestId('release-toggle-visibility'),
          ).not.toBeInTheDocument()
        })

        it('should allow for hiding of draft perspective', async () => {
          await prerenderTest()

          const drafts = within(screen.getByTestId('release-menu'))
            .getByText('Drafts')
            .closest('button')!

          expect(within(drafts).getByTestId('release-toggle-visibility')).toBeInTheDocument()
          // toggle to hide
          await userEvent.click(within(drafts).getByTestId('release-toggle-visibility'))
          expect(useExcludedPerspectiveMockReturn.toggleExcludedPerspective).toHaveBeenCalledWith(
            'drafts',
          )
          // toggle to include
          await userEvent.click(within(drafts).getByTestId('release-toggle-visibility'))
          expect(useExcludedPerspectiveMockReturn.toggleExcludedPerspective).toHaveBeenCalledWith(
            'drafts',
          )
        })

        it('should not allow hiding of the current perspective', async () => {
          await prerenderTest()

          const currentRelease = within(screen.getByTestId('release-menu'))
            .getByText('active Scheduled 2')
            .closest('button')!

          expect(
            within(currentRelease).queryByTestId('release-toggle-visibility'),
          ).not.toBeInTheDocument()
        })

        it('should not allow hiding of un-nested releases', async () => {
          await prerenderTest()

          const unNestedRelease = within(screen.getByTestId('release-menu'))
            .getByText('undecided Release')
            .closest('button')!

          expect(
            within(unNestedRelease).queryByTestId('release-toggle-visibility'),
          ).not.toBeInTheDocument()
        })

        it('should not allow hiding of locked in scheduled releases', async () => {
          await prerenderTest()

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

        const indicatorIcon = within(activeReleaseMenuItem).getByTestId('release-indicator-icon')
        expect(indicatorIcon).toHaveStyle({opacity: '0'})
      })

      describe('filtering', () => {
        beforeEach(() => {
          // A selected release extends the stack line through the releases under it,
          // so the filter test can tell the line was removed rather than never painted.
          usePerspectiveMockReturn.selectedPerspectiveName = 'rScheduled2'
          usePerspectiveMockReturn.selectedPerspective = {
            ...activeScheduledRelease,
            _id: '_.releases.rScheduled2',
            metadata: {...activeScheduledRelease.metadata, title: 'active Scheduled 2'},
          }
        })

        it('returns matching releases under their category and drops the stack line', async () => {
          await renderAndWaitForStableMenu()
          const releaseMenuElement = screen.getByTestId('release-menu')
          const releaseMenu = within(releaseMenuElement)

          expect(releaseMenuElement.querySelector('[data-stack-line="true"]')).toBeTruthy()

          await userEvent.type(
            releaseMenu.getByPlaceholderText('Find a version or release'),
            'ACTIVE',
          )

          releaseMenu.getByText('As soon as possible')
          releaseMenu.getByText('At time')
          releaseMenu.getByText('active asap Release')
          releaseMenu.getByText('active asap Error Release')
          releaseMenu.getByText('active Release')
          releaseMenu.getByText('active Scheduled 2')

          expect(releaseMenu.queryByText('Undecided')).toBeNull()
          expect(releaseMenu.queryByText('scheduled Release')).toBeNull()
          expect(releaseMenu.queryByText('Published')).toBeNull()
          expect(releaseMenu.queryByText('Drafts')).toBeNull()
          expect(releaseMenu.queryByTestId('create-new-release-button')).toBeNull()
          expect(releaseMenuElement.querySelector('[data-stack-line="true"]')).toBeNull()
        })

        it('matches a system perspective and restores the menu when the filter is cleared', async () => {
          await renderAndWaitForStableMenu()
          const releaseMenuElement = screen.getByTestId('release-menu')
          const releaseMenu = within(releaseMenuElement)

          await userEvent.type(
            releaseMenu.getByPlaceholderText('Find a version or release'),
            'draft',
          )

          releaseMenu.getByText('Drafts')
          expect(releaseMenu.queryByText('Published')).toBeNull()
          expect(releaseMenu.queryByText('As soon as possible')).toBeNull()
          expect(releaseMenu.queryByText('active Release')).toBeNull()
          expect(releaseMenuElement.querySelector('[data-stack-line="true"]')).toBeNull()

          await userEvent.clear(releaseMenu.getByPlaceholderText('Find a version or release'))

          releaseMenu.getByText('Published')
          releaseMenu.getByText('Drafts')
          releaseMenu.getByText('As soon as possible')
          releaseMenu.getByText('active Release')
          releaseMenu.getByTestId('create-new-release-button')
          expect(releaseMenuElement.querySelector('[data-stack-line="true"]')).toBeTruthy()
        })
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
