import {type ReleaseDocument} from '@sanity/client'
import {Menu} from '@sanity/ui/menu'
import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {type ComponentProps, useState} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

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

/**
 * `ReleasesList` takes its filter query from `GlobalPerspectiveMenu`, which owns
 * it so it can be cleared when the popover closes. This stands in for that.
 */
function TestReleasesList(
  props: Omit<ComponentProps<typeof ReleasesList>, 'filterQuery' | 'onFilterQueryChange'>,
) {
  const [filterQuery, setFilterQuery] = useState('')
  return <ReleasesList {...props} filterQuery={filterQuery} onFilterQueryChange={setFilterQuery} />
}

vi.mock('../../../releases/contexts/upsell/useReleasesUpsell', () => ({
  useReleasesUpsell: vi.fn(() => useReleasesUpsellMockReturn),
}))

vi.mock('../../../releases/store/useReleasePermissions', () => ({
  useReleasePermissions: vi.fn(() => useReleasePermissionsMockReturn),
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
          <TestReleasesList handleOpenBundleDialog={handleOpenBundleDialog} areReleasesEnabled />
        </Menu>,
        {wrapper},
      )
      await flushMicrotasksThisIsACodeSmell()

      expect(screen.getByText('active asap Release')).toBeInTheDocument()
      expect(screen.getByText('active Release')).toBeInTheDocument()
      expect(screen.getByText('undecided Release')).toBeInTheDocument()
    })

    it('narrows the release list by the filter query, leaving the system stack alone', async () => {
      const wrapper = await createTestProvider()
      render(
        <Menu>
          <TestReleasesList handleOpenBundleDialog={handleOpenBundleDialog} areReleasesEnabled />
        </Menu>,
        {wrapper},
      )
      await flushMicrotasksThisIsACodeSmell()

      await userEvent.type(screen.getByTestId('release-menu-filter'), 'undecided')

      await waitFor(() => {
        expect(screen.queryByText('active asap Release')).not.toBeInTheDocument()
      })
      expect(screen.queryByText('active Release')).not.toBeInTheDocument()
      expect(screen.getByText('undecided Release')).toBeInTheDocument()

      // Published and Drafts are not releases and are never filtered out.
      expect(screen.getByTestId('release-published')).toBeInTheDocument()
      expect(screen.getByTestId('release-drafts')).toBeInTheDocument()
    })

    it('calls handleOpenBundleDialog when create new release button is clicked', async () => {
      const wrapper = await createTestProvider()
      render(
        <Menu>
          <TestReleasesList handleOpenBundleDialog={handleOpenBundleDialog} areReleasesEnabled />
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
          <TestReleasesList handleOpenBundleDialog={handleOpenBundleDialog} areReleasesEnabled />
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
          <TestReleasesList
            handleOpenBundleDialog={handleOpenBundleDialog}
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
          <TestReleasesList
            handleOpenBundleDialog={handleOpenBundleDialog}
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
          <TestReleasesList handleOpenBundleDialog={handleOpenBundleDialog} areReleasesEnabled />
        </Menu>,
        {wrapper},
      )
      await flushMicrotasksThisIsACodeSmell()
      await waitFor(() => expect(screen.getByTestId('create-new-release-button')).toBeDisabled())
    })
  })
})
