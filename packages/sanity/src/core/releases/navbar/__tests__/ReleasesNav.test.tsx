import {fireEvent, render, type RenderResult, screen, waitFor, within} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {
  activeASAPRelease,
  activeScheduledRelease,
  scheduledRelease,
} from '../../__fixtures__/release.fixture'
import {usePerspectiveMock} from '../../hooks/__tests__/__mocks__/usePerspective.mock'
import {useReleasesMock} from '../../store/__tests__/__mocks/useReleases.mock'
import {LATEST} from '../../util/const'
import {ReleasesNav} from '../ReleasesNav'

vi.mock('../../hooks/usePerspective', () => ({
  usePerspective: vi.fn(() => usePerspectiveMock),
}))

vi.mock('../../store/useReleases', () => ({
  useReleases: vi.fn(() => useReleasesMock),
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
    usePerspectiveMock.currentGlobalBundle = activeScheduledRelease

    await renderTest()

    fireEvent.click(screen.getByTestId('clear-perspective-button'))

    expect(usePerspectiveMock.setPerspective).toHaveBeenCalledWith(LATEST._id)
  })

  it('should list the title of the chosen perspective', async () => {
    usePerspectiveMock.currentGlobalBundle = activeScheduledRelease

    await renderTest()

    screen.getByText('active Release')
  })

  it('should show release avatar for chosen perspective', async () => {
    usePerspectiveMock.currentGlobalBundle = activeASAPRelease

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
      useReleasesMock.data = [
        activeScheduledRelease,
        {
          ...activeScheduledRelease,
          _id: '_.releases.active-scheduled-2',
          name: 'activeScheduled2',
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

        expect(usePerspectiveMock.setPerspective).toHaveBeenCalledWith('published')
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
    })

    describe('release layering', () => {
      beforeEach(() => {
        // since usePerspective is mocked, and the layering exclude toggle is
        // controlled by currentGlobalBundleId, we need to manually set it
        // to the release that will be selected in below tests
        usePerspectiveMock.currentGlobalBundleId = '_.releases.active-scheduled-2'
        // add an undecided release to expand testing
        useReleasesMock.data = [
          ...useReleasesMock.data,
          {
            ...activeASAPRelease,
            _id: '_.releases.undecidedRelease',
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
          expect(usePerspectiveMock.setPerspectiveFromReleaseDocumentId).toHaveBeenCalledWith(
            '_.releases.active-scheduled-2',
          )
          expect(usePerspectiveMock.setPerspective).not.toHaveBeenCalled()
        })

        it('should allow for hiding of any deeper layered releases', async () => {
          const deepLayerRelease = within(screen.getByTestId('release-menu'))
            .getByText('active Release')
            .closest('button')!

          // toggle to hide
          fireEvent.click(within(deepLayerRelease).getByTestId('release-toggle-visibility'))
          expect(usePerspectiveMock.toggleExcludedPerspective).toHaveBeenCalledWith('activeRelease')

          // toggle to include
          fireEvent.click(within(deepLayerRelease).getByTestId('release-toggle-visibility'))
          expect(usePerspectiveMock.toggleExcludedPerspective).toHaveBeenCalledWith('activeRelease')
        })

        it('should not allow for hiding of published perspective', async () => {
          const publishedRelease = within(screen.getByTestId('release-menu'))
            .getByText('Published')
            .closest('button')!

          expect(
            within(publishedRelease).queryByTestId('release-toggle-visibility'),
          ).not.toBeInTheDocument()
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
        usePerspectiveMock.isPerspectiveExcluded.mockImplementation((id) => {
          return id === 'activeRelease'
        })

        await renderAndWaitForStableMenu()

        const activeReleaseMenuItem = within(screen.getByTestId('release-menu'))
          .getByText('active Release')
          .closest('button')!

        expect(
          within(activeReleaseMenuItem).queryByTestId('release-avatar-primary'),
        ).not.toBeInTheDocument()
      })
    })
  })
})
