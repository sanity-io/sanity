import {render, type RenderResult, screen, waitFor, within} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
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

const mockedSetPerspective = vi.fn()
vi.mock('../../../perspective/useSetPerspective', () => ({
  useSetPerspective: vi.fn(() => mockedSetPerspective),
}))

vi.mock('../../../releases/store/useActiveReleases', () => ({
  useActiveReleases: vi.fn(() => useActiveReleasesMockReturn),
}))

vi.mock('../ViewContentReleasesMenuItem', () => ({
  ViewContentReleasesMenuItem: () => null,
}))

vi.mock('../ScheduledDraftsMenuItem', () => ({
  ScheduledDraftsMenuItem: () => null,
}))

const mockedUseWorkspace = vi.fn()
vi.mock('../../../studio/useWorkspace', () => ({
  useWorkspace: vi.fn(() => mockedUseWorkspace),
}))

vi.mock('sanity/router', async (importOriginal) => ({
  ...(await importOriginal()),
  IntentLink: vi.fn().mockImplementation((props) => <a {...props} />),
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
  currentRenderedInstance = render(<ReleasesNav withReleasesToolButton />, {wrapper})

  return currentRenderedInstance
}

describe('ReleasesNav', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)
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

  it('should list the title of the chosen perspective', async () => {
    usePerspectiveMockReturn.selectedPerspective = activeScheduledRelease
    usePerspectiveMockReturn.selectedPerspectiveName = 'rActive'

    await renderTest()

    screen.getByText('active Release')
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

    describe('release selection', () => {
      beforeEach(() => {
        // usePerspective is mocked, so the selected perspective has to be set by
        // hand to the release the tests below click on.
        usePerspectiveMockReturn.selectedPerspectiveName = 'rScheduled2'
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

        it('should show a lock icon on scheduled releases', async () => {
          await prerenderTest()

          const scheduledReleaseMenuItem = within(screen.getByTestId('release-menu'))
            .getByText('scheduled Release')
            .closest('button')!

          expect(
            within(scheduledReleaseMenuItem).getByTestId('release-lock-icon'),
          ).toBeInTheDocument()
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
