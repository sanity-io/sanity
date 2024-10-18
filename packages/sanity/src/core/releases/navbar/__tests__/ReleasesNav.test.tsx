import {fireEvent, render, screen} from '@testing-library/react'
import {LATEST} from 'sanity'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {usePerspective} from '../../hooks/usePerspective'
import {ReleasesNav} from '../ReleasesNav'

vi.mock('../../hooks/usePerspective', () => ({
  usePerspective: vi.fn(),
}))

vi.mock('sanity/router', async (importOriginal) => ({
  ...(await importOriginal()),
  IntentLink: vi.fn().mockImplementation((props) => <a {...props} />),
  useRouterState: vi.fn().mockReturnValue(undefined),
}))

vi.mock('../../../store/bundles/useBundles', () => ({
  useBundles: vi.fn().mockReturnValue({
    deletedBundles: {},
    loading: false,
    data: [{_id: 'a-bundle', title: 'Test Bundle'}],
  }),
}))

const mockUsePerspective = usePerspective as Mock<typeof usePerspective>

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
      currentGlobalBundle: LATEST,
      setPerspective: mockSetPerspective,
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
      currentGlobalBundle: {_id: 'a-bundle', title: 'Test Bundle'},
      setPerspective: mockSetPerspective,
    })

    await renderTest()

    fireEvent.click(screen.getByTestId('clear-perspective-button'))

    expect(mockSetPerspective).toHaveBeenCalledWith(LATEST._id)
  })

  it('should list the title of the chosen perspective', async () => {
    mockUsePerspective.mockReturnValue({
      currentGlobalBundle: {_id: 'a-bundle', title: 'Test Bundle'},
      setPerspective: mockSetPerspective,
    })

    await renderTest()

    screen.getByText('Test Bundle')
  })
})
