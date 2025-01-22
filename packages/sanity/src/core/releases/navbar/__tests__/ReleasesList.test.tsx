import {Menu} from '@sanity/ui'
import {fireEvent, render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {
  activeASAPRelease,
  activeScheduledRelease,
  activeUndecidedRelease,
} from '../../__fixtures__/release.fixture'
import {
  mockUseActiveReleases,
  useActiveReleasesMockReturn,
} from '../../store/__tests__/__mocks/useActiveReleases.mock'
import {ReleasesList} from '../ReleasesList'

vi.mock('../../store/useActiveReleases', () => ({
  useActiveReleases: vi.fn(() => useActiveReleasesMockReturn),
}))

const setCreateBundleDialogOpen = vi.fn()

describe('ReleasesList', () => {
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

  it('calls setCreateBundleDialogOpen when create new release button is clicked', () => {
    fireEvent.click(screen.getByTestId('release.action.create-new'))
    expect(setCreateBundleDialogOpen).toHaveBeenCalledWith(true)
  })
})
