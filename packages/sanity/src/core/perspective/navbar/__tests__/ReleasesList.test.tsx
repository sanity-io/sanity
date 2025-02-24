import {Menu} from '@sanity/ui'
import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

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

vi.mock('../../../releases/contexts/upsell/useReleasesUpsell', () => ({
  useReleasesUpsell: vi.fn(() => useReleasesUpsellMockReturn),
}))

vi.mock('../../../releases/store/useReleasePermissions', () => ({
  useReleasePermissions: vi.fn(() => useReleasePermissionsMockReturn),
}))

vi.mock('../../../releases/store/useActiveReleases', () => ({
  useActiveReleases: vi.fn(() => useActiveReleasesMockReturn),
}))

const setCreateBundleDialogOpen = vi.fn()

describe('ReleasesList', () => {
  describe('when releases are enabled', () => {
    beforeEach(async () => {
      mockUseActiveReleases.mockReturnValue({
        ...useActiveReleasesMockReturn,
        data: [activeASAPRelease, activeScheduledRelease, activeUndecidedRelease],
      })
      mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)
      const wrapper = await createTestProvider()
      render(
        <Menu>
          <ReleasesList
            setScrollContainer={vi.fn()}
            onScroll={vi.fn()}
            isRangeVisible={false}
            selectedReleaseId={undefined}
            setCreateBundleDialogOpen={setCreateBundleDialogOpen}
            scrollElementRef={{current: null}}
            areReleasesEnabled
          />
        </Menu>,
        {wrapper},
      )
    })

    it('renders releases when not loading', async () => {
      expect(screen.getByText('active asap Release')).toBeInTheDocument()
      expect(screen.getByText('active Release')).toBeInTheDocument()
      expect(screen.getByText('undecided Release')).toBeInTheDocument()
    })

    it('calls setCreateBundleDialogOpen when create new release button is clicked', async () => {
      await waitFor(() =>
        expect(screen.getByTestId('create-new-release-button')).not.toBeDisabled(),
      )

      fireEvent.click(screen.getByTestId('create-new-release-button'))
      expect(setCreateBundleDialogOpen).toHaveBeenCalledWith(true)
    })
  })

  describe('when releases are disabled', () => {
    beforeEach(() => {
      beforeEach(async () => {
        mockUseActiveReleases.mockReturnValue({
          ...useActiveReleasesMockReturn,
          data: [activeASAPRelease, activeScheduledRelease, activeUndecidedRelease],
        })
        const wrapper = await createTestProvider()
        render(
          <Menu>
            <ReleasesList
              setScrollContainer={vi.fn()}
              onScroll={vi.fn()}
              isRangeVisible={false}
              selectedReleaseId={undefined}
              setCreateBundleDialogOpen={setCreateBundleDialogOpen}
              scrollElementRef={{current: null}}
              areReleasesEnabled={false}
            />
          </Menu>,
          {wrapper},
        )
      })
    })

    it('should hide the releases list, but show publish and draft', async () => {
      waitFor(() => {
        expect(screen.queryByTestId('release-drafts')).toBeInTheDocument()
        expect(screen.queryByTestId('release-drafts')).toBeInTheDocument()
        expect(screen.queryByTestId('release-rASAP')).not.toBeInTheDocument()
        expect(screen.queryByTestId('release-rScheduled')).not.toBeInTheDocument()
        expect(screen.queryByTestId('release-rActive')).not.toBeInTheDocument()
      })
    })

    it('should hide the create new release', async () => {
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
      const wrapper = await createTestProvider()
      render(
        <Menu>
          <ReleasesList
            setScrollContainer={vi.fn()}
            onScroll={vi.fn()}
            isRangeVisible={false}
            selectedReleaseId={undefined}
            setCreateBundleDialogOpen={setCreateBundleDialogOpen}
            scrollElementRef={{current: null}}
            areReleasesEnabled
          />
        </Menu>,
        {wrapper},
      )
    })

    it('calls doesnt open the create dialog user has no permissions', async () => {
      await waitFor(() => expect(screen.getByTestId('create-new-release-button')).toBeDisabled())
    })
  })
})
