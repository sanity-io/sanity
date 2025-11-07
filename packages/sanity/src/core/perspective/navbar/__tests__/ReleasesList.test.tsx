import {type ReleaseDocument} from '@sanity/client'
import {Menu} from '@sanity/ui'
import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
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
            onScroll={vi.fn()}
            isRangeVisible={false}
            selectedReleaseId={undefined}
            handleOpenBundleDialog={handleOpenBundleDialog}
            scrollElementRef={{current: null}}
            areReleasesEnabled
          />
        </Menu>,
        {wrapper},
      )

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
            onScroll={vi.fn()}
            isRangeVisible={false}
            selectedReleaseId={undefined}
            handleOpenBundleDialog={handleOpenBundleDialog}
            scrollElementRef={{current: null}}
            areReleasesEnabled
          />
        </Menu>,
        {wrapper},
      )

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
            onScroll={vi.fn()}
            isRangeVisible={false}
            selectedReleaseId={undefined}
            handleOpenBundleDialog={handleOpenBundleDialog}
            scrollElementRef={{current: null}}
            areReleasesEnabled
          />
        </Menu>,
        {wrapper},
      )

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
            onScroll={vi.fn()}
            isRangeVisible={false}
            selectedReleaseId={undefined}
            handleOpenBundleDialog={handleOpenBundleDialog}
            scrollElementRef={{current: null}}
            areReleasesEnabled={false}
          />
        </Menu>,
        {wrapper},
      )

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
            onScroll={vi.fn()}
            isRangeVisible={false}
            selectedReleaseId={undefined}
            handleOpenBundleDialog={handleOpenBundleDialog}
            scrollElementRef={{current: null}}
            areReleasesEnabled={false}
          />
        </Menu>,
        {wrapper},
      )

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
            onScroll={vi.fn()}
            isRangeVisible={false}
            selectedReleaseId={undefined}
            handleOpenBundleDialog={handleOpenBundleDialog}
            scrollElementRef={{current: null}}
            areReleasesEnabled
          />
        </Menu>,
        {wrapper},
      )
      await waitFor(() => expect(screen.getByTestId('create-new-release-button')).toBeDisabled())
    })
  })
})
