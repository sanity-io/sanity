import {type ReleaseDocument} from '@sanity/client'
import {Menu} from '@sanity/ui/menu'
import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {afterEach, beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {flushMicrotasksThisIsACodeSmell} from '../../../../../test/testUtils/flushMicrotasks'
import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {
  activeASAPRelease,
  activeScheduledRelease,
  activeUndecidedRelease,
} from '../../../releases/__fixtures__/release.fixture'
import {useReleasesUpsellMockReturn} from '../../../releases/contexts/upsell/__mocks__/useReleasesUpsell.mock'
import {
  mockUseActiveReleases,
  useActiveReleasesMockReturn,
} from '../../../releases/store/__tests__/__mocks/useActiveReleases.mock'
import {
  mockUseReleasePermissions,
  useReleasePermissionsMockReturn,
  useReleasesPermissionsMockReturnFalse,
  useReleasesPermissionsMockReturnTrue,
} from '../../../releases/store/__tests__/__mocks/useReleasePermissions.mock'
import {ReleasesList} from '../ReleasesList'
import {useScheduledDraftsAvailable} from '../ScheduledDraftsMenuItem'

vi.mock('../../../releases/contexts/upsell/useReleasesUpsell', () => ({
  useReleasesUpsell: vi.fn(() => useReleasesUpsellMockReturn),
}))

vi.mock('../../../releases/store/useReleasePermissions', () => ({
  useReleasePermissions: vi.fn(() => useReleasePermissionsMockReturn),
}))

vi.mock('../../../releases/store/useActiveReleases', () => ({
  useActiveReleases: vi.fn(() => useActiveReleasesMockReturn),
}))

vi.mock('../ScheduledDraftsMenuItem', async (importOriginal) => ({
  ...(await importOriginal()),
  useScheduledDraftsAvailable: vi.fn(() => false),
}))

const mockUseScheduledDraftsAvailable = useScheduledDraftsAvailable as Mock<
  typeof useScheduledDraftsAvailable
>

const handleOpenBundleDialog = vi.fn()

describe('ReleasesList', () => {
  describe('when releases are enabled', () => {
    beforeEach(async () => {
      mockUseActiveReleases.mockReturnValue({
        ...useActiveReleasesMockReturn,
        data: [activeASAPRelease, activeScheduledRelease, activeUndecidedRelease],
      })
      mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)
    })

    it('renders releases when not loading', async () => {
      const wrapper = await createTestProvider()
      render(
        <Menu>
          <ReleasesList
            setScrollContainer={vi.fn()}
            isRangeVisible={false}
            selectedPerspectiveName={undefined}
            handleOpenBundleDialog={handleOpenBundleDialog}
            scrollElementRef={{current: null}}
            areReleasesEnabled
          />
        </Menu>,
        {wrapper},
      )
      await flushMicrotasksThisIsACodeSmell()

      expect(screen.getByText('active asap Release')).toBeInTheDocument()
      expect(screen.getByText('active Release')).toBeInTheDocument()
      expect(screen.getByText('undecided Release')).toBeInTheDocument()
    })

    it('calls handleOpenBundleDialog when create new release button is clicked', async () => {
      const wrapper = await createTestProvider()
      render(
        <Menu>
          <ReleasesList
            setScrollContainer={vi.fn()}
            isRangeVisible={false}
            selectedPerspectiveName={undefined}
            handleOpenBundleDialog={handleOpenBundleDialog}
            scrollElementRef={{current: null}}
            areReleasesEnabled
          />
        </Menu>,
        {wrapper},
      )
      await flushMicrotasksThisIsACodeSmell()

      await waitFor(() =>
        expect(screen.getByTestId('create-new-release-button')).not.toBeDisabled(),
      )

      await userEvent.click(screen.getByTestId('create-new-release-button'))
      expect(handleOpenBundleDialog).toHaveBeenCalled()
    })
  })

  describe('when releases with cardinality filtering are enabled', () => {
    beforeEach(async () => {
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
        data: [
          activeASAPRelease,
          activeScheduledRelease,
          activeUndecidedRelease,
          releaseWithCardinalityOne,
        ],
      })

      mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)
    })

    it('filters out releases with cardinality "one"', async () => {
      const wrapper = await createTestProvider()
      render(
        <Menu>
          <ReleasesList
            setScrollContainer={vi.fn()}
            isRangeVisible={false}
            selectedPerspectiveName={undefined}
            handleOpenBundleDialog={handleOpenBundleDialog}
            scrollElementRef={{current: null}}
            areReleasesEnabled
          />
        </Menu>,
        {wrapper},
      )
      await flushMicrotasksThisIsACodeSmell()

      expect(screen.getByText('active asap Release')).toBeInTheDocument()
      expect(screen.getByText('active Release')).toBeInTheDocument()
      expect(screen.getByText('undecided Release')).toBeInTheDocument()

      expect(screen.queryByText('Cardinality One Release')).not.toBeInTheDocument()
    })
  })

  describe('when releases are disabled', () => {
    beforeEach(async () => {
      mockUseActiveReleases.mockReturnValue({
        ...useActiveReleasesMockReturn,
        data: [activeASAPRelease, activeScheduledRelease, activeUndecidedRelease],
      })
    })

    it('should hide the releases list, but show publish and draft', async () => {
      const wrapper = await createTestProvider()
      render(
        <Menu>
          <ReleasesList
            setScrollContainer={vi.fn()}
            isRangeVisible={false}
            selectedPerspectiveName={undefined}
            handleOpenBundleDialog={handleOpenBundleDialog}
            scrollElementRef={{current: null}}
            areReleasesEnabled={false}
          />
        </Menu>,
        {wrapper},
      )
      await flushMicrotasksThisIsACodeSmell()

      await waitFor(() => {
        expect(screen.getByTestId('release-drafts')).toBeInTheDocument()
        expect(screen.queryByTestId('release-rASAP')).not.toBeInTheDocument()
        expect(screen.queryByTestId('release-rScheduled')).not.toBeInTheDocument()
        expect(screen.queryByTestId('release-rActive')).not.toBeInTheDocument()
      })
      expect(screen.getByTestId('release-drafts')).toBeInTheDocument()
    })

    it('should hide the create new release', async () => {
      const wrapper = await createTestProvider()
      render(
        <Menu>
          <ReleasesList
            setScrollContainer={vi.fn()}
            isRangeVisible={false}
            selectedPerspectiveName={undefined}
            handleOpenBundleDialog={handleOpenBundleDialog}
            scrollElementRef={{current: null}}
            areReleasesEnabled={false}
          />
        </Menu>,
        {wrapper},
      )
      await flushMicrotasksThisIsACodeSmell()

      expect(screen.queryByTestId('create-new-release-button')).toBeNull()
    })
  })

  describe('when releases are enabled without permissions', () => {
    beforeEach(async () => {
      mockUseActiveReleases.mockReturnValue({
        ...useActiveReleasesMockReturn,
        data: [activeASAPRelease, activeScheduledRelease, activeUndecidedRelease],
      })
      mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnFalse)
    })

    it('calls doesnt open the create dialog user has no permissions', async () => {
      const wrapper = await createTestProvider()
      render(
        <Menu>
          <ReleasesList
            setScrollContainer={vi.fn()}
            isRangeVisible={false}
            selectedPerspectiveName={undefined}
            handleOpenBundleDialog={handleOpenBundleDialog}
            scrollElementRef={{current: null}}
            areReleasesEnabled
          />
        </Menu>,
        {wrapper},
      )
      await flushMicrotasksThisIsACodeSmell()
      await waitFor(() => expect(screen.getByTestId('create-new-release-button')).toBeDisabled())
    })
  })

  // The other layouts, with the lines between their parts, are asserted with real styles in
  // ReleasesList.browser.test.tsx. The scheduled drafts action depends on a project feature the
  // mock client cannot grant, so its two combinations are covered here with the hook mocked.
  describe('when scheduled drafts are available', () => {
    /** Every menu item of the list, top to bottom, by test id */
    const getMenuItems = () =>
      screen.getAllByRole('menuitem').map((item) => item.getAttribute('data-testid'))

    beforeEach(() => {
      mockUseActiveReleases.mockReturnValue({...useActiveReleasesMockReturn, data: []})
      mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)
      mockUseScheduledDraftsAvailable.mockReturnValue(true)
    })

    afterEach(() => {
      mockUseScheduledDraftsAvailable.mockReturnValue(false)
    })

    async function renderList(areReleasesEnabled: boolean) {
      const wrapper = await createTestProvider()
      render(
        <Menu>
          <ReleasesList
            setScrollContainer={vi.fn()}
            isRangeVisible={false}
            selectedPerspectiveName={undefined}
            handleOpenBundleDialog={handleOpenBundleDialog}
            scrollElementRef={{current: null}}
            areReleasesEnabled={areReleasesEnabled}
          />
        </Menu>,
        {wrapper},
      )
      await flushMicrotasksThisIsACodeSmell()
    }

    it('renders the scheduled drafts action on its own when releases are disabled', async () => {
      await renderList(false)

      expect(getMenuItems()).toEqual([
        'release-published',
        'release-drafts',
        'scheduled-drafts-menu-item',
      ])
    })

    it('lists the scheduled drafts action before the release actions', async () => {
      await renderList(true)

      expect(getMenuItems()).toEqual([
        'release-published',
        'release-drafts',
        'scheduled-drafts-menu-item',
        'view-content-releases-menu-item',
        'create-new-release-button',
      ])
    })
  })
})
