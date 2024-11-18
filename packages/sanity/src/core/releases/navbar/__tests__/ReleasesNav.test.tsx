import {fireEvent, render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {useStudioPerspectiveState} from '../../hooks/useStudioPerspectiveState'
import {LATEST} from '../../util/const'
import {ReleasesNav} from '../ReleasesNav'

vi.mock('../../hooks/usePerspective', () => ({
  usePerspective: vi.fn(),
}))

vi.mock('sanity/router', async (importOriginal) => ({
  ...(await importOriginal()),
  IntentLink: vi.fn().mockImplementation((props) => <a {...props} />),
  useRouterState: vi.fn().mockReturnValue(undefined),
}))

vi.mock('../../../store/releases/useBundles', () => ({
  useBundles: vi.fn().mockReturnValue({
    deletedBundles: {},
    loading: false,
    data: [{_id: 'a-release', title: 'Test Bundle'}],
  }),
}))

const mockUsePerspective = useStudioPerspectiveState as Mock<typeof useStudioPerspectiveState>

const renderTest = async () => {
  const wrapper = await createTestProvider({
    resources: [],
  })
  return render(<ReleasesNav />, {wrapper})
}

const mockSetPerspective = vi.fn()

describe('ReleasesNav', () => {
  beforeEach(() => {
    mockUsePerspective.mockReturnValue({
      currentGlobalRelease: LATEST,
      setCurrent: mockSetPerspective,
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
    mockUsePerspective.mockReturnValue({
      currentGlobalRelease: {
        _id: '_.releases.a-release',
        metadata: {title: 'Test Release'},
      },
      setCurrent: mockSetPerspective,
    })

    await renderTest()

    fireEvent.click(screen.getByTestId('clear-perspective-button'))

    expect(mockSetPerspective).toHaveBeenCalledWith(LATEST._id)
  })

  it('should list the title of the chosen perspective', async () => {
    mockUsePerspective.mockReturnValue({
      currentGlobalRelease: {
        _id: '_.releases.a-release',
        metadata: {
          title: 'Test Bundle',
        },
      },
      setCurrent: mockSetPerspective,
    })

    await renderTest()

    screen.getByText('Test Bundle')
  })

  it('should show release avatar for chosen perspective', async () => {
    mockUsePerspective.mockReturnValue({
      currentGlobalRelease: {
        _id: '_.releases.a-release',
        metadata: {title: 'Test Bundle', releaseType: 'asap'},
      },
      setCurrent: mockSetPerspective,
    })

    await renderTest()

    screen.getByTestId('release-avatar-critical')
  })
})
