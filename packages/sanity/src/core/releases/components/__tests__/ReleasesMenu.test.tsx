import {fireEvent, render, screen, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {act} from 'react'
import {type ReleaseDocument, useReleases} from 'sanity'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {Button} from '../../../../ui-components'
import {usePerspective} from '../../hooks/usePerspective'
import {LATEST} from '../../util/const'
import {ReleasesMenu} from '../ReleasesMenu'

vi.mock('../../hooks/usePerspective', () => ({
  usePerspective: vi.fn().mockReturnValue({
    currentGlobalBundle: {},
    setPerspective: vi.fn(),
  }),
}))

vi.mock('../../util/util', () => ({
  isDraftOrPublished: vi.fn(),
}))

vi.mock('../../../store/release/useReleases', () => ({
  useReleases: vi.fn().mockReturnValue({deletedReleases: {}}),
}))

const mockUseReleases = useReleases as Mock<typeof useReleases>

describe('ReleasesMenu', () => {
  const mockUsePerspective = usePerspective as Mock
  const ButtonTest = <Button text="Button Test" />
  const mockReleases: ReleaseDocument[] = [
    {
      hue: 'magenta',
      _id: 'spring-drop',
      _type: 'release',
      _rev: '6z08CvvPnPe5pWSKJ5zPRR',
      icon: 'heart-filled',
      description: 'What a spring drop, allergies galore 🌸',
      title: 'Spring Drop',
      _updatedAt: '2024-07-02T11:37:51Z',
      _createdAt: '2024-07-02T11:37:51Z',
      createdBy: '',
      releaseType: 'asap',
    },
    {
      icon: 'drop',
      title: 'Autumn Drop',
      _type: 'release',
      hue: 'yellow',
      _id: 'autumn-drop',
      _createdAt: '2024-07-02T11:37:06Z',
      _rev: '6z08CvvPnPe5pWSKJ5zJiK',
      _updatedAt: '2024-07-02T11:37:06Z',
      createdBy: '',
      releaseType: 'asap',
    },
    {
      _createdAt: '2024-07-02T11:36:00Z',
      _rev: '22LTUf6tptoEq53N9U5CzE',
      icon: 'sun',
      description: 'What a summer drop woo hoo! ☀️',
      _updatedAt: '2024-07-02T11:36:00Z',
      title: 'Summer Drop',
      _type: 'release',
      hue: 'red',
      _id: 'f6b2c2cc-1732-4465-bfb3-dd205b5d78e9',
      createdBy: '',
      releaseType: 'asap',
    },
  ]

  beforeEach(() => {
    mockUsePerspective.mockClear()
  })

  it('should render loading spinner when loading is true', async () => {
    const wrapper = await createTestProvider()
    render(<ReleasesMenu button={ButtonTest} bundles={[]} loading />, {
      wrapper,
    })

    expect(screen.getByRole('button', {name: 'Button Test'})).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: 'Button Test'}))

    act(() => {
      expect(screen.getByTestId('release-menu')).toBeInTheDocument()
      expect(screen.getByTestId('spinner')).toBeInTheDocument()
    })
  })

  it('should render latest release menu item when bundles are null', async () => {
    const wrapper = await createTestProvider()
    render(<ReleasesMenu button={ButtonTest} bundles={null} loading={false} />, {
      wrapper,
    })

    fireEvent.click(screen.getByRole('button', {name: 'Button Test'}))

    act(() => {
      expect(screen.getByTestId('latest-menu-item')).toBeInTheDocument()
      expect(screen.queryByTestId('bundles-list')).not.toBeInTheDocument()
    })
  })

  it('should render latest release menu item when bundles are archived', async () => {
    const wrapper = await createTestProvider()
    const archivedBundles = mockReleases.map((bundle) => ({
      ...bundle,
      archivedAt: '2024-07-29T01:49:56.066Z',
    }))
    render(<ReleasesMenu button={ButtonTest} bundles={archivedBundles} loading={false} />, {
      wrapper,
    })

    fireEvent.click(screen.getByRole('button', {name: 'Button Test'}))

    act(() => {
      expect(screen.getByTestId('latest-menu-item')).toBeInTheDocument()
      expect(screen.queryByTestId('bundles-list')).not.toBeInTheDocument()
    })
  })

  it('should render latest release menu item as selected when currentGlobalBundle is LATEST', async () => {
    mockUsePerspective.mockReturnValue({
      currentGlobalBundle: LATEST,
      setPerspective: vi.fn(),
    })

    const wrapper = await createTestProvider()
    render(<ReleasesMenu button={ButtonTest} bundles={[]} loading={false} />, {
      wrapper,
    })

    fireEvent.click(screen.getByRole('button', {name: 'Button Test'}))

    act(() => {
      expect(screen.getByTestId('latest-menu-item')).toBeInTheDocument()
      expect(screen.getByTestId('latest-checkmark-icon')).toBeInTheDocument()
    })
  })

  it('should render release as selected when currentGlobalBundle is that release', async () => {
    mockUsePerspective.mockReturnValue({
      currentGlobalBundle: mockReleases[0],
      setPerspective: vi.fn(),
    })

    const wrapper = await createTestProvider()
    render(<ReleasesMenu button={ButtonTest} bundles={mockReleases} loading={false} />, {
      wrapper,
    })

    fireEvent.click(screen.getByRole('button', {name: 'Button Test'}))

    act(() => {
      expect(screen.getByText(mockReleases[0].title)).toBeInTheDocument()
      expect(screen.getByTestId(`${mockReleases[0]._id}-checkmark-icon`)).toBeInTheDocument()
    })
  })

  it('should render release menu items when bundles are provided', async () => {
    const wrapper = await createTestProvider()
    render(<ReleasesMenu button={ButtonTest} bundles={mockReleases} loading={false} />, {
      wrapper,
    })

    fireEvent.click(screen.getByRole('button', {name: 'Button Test'}))

    act(() => {
      expect(screen.getByText('Spring Drop')).toBeInTheDocument()
      expect(screen.getByText('Autumn Drop')).toBeInTheDocument()
      expect(screen.getByText('Summer Drop')).toBeInTheDocument()
    })
  })

  it('should call setPerspective when a release menu item is clicked', async () => {
    const setPerspective = vi.fn()
    mockUsePerspective.mockReturnValue({
      currentGlobalBundle: LATEST,
      setPerspective,
    })

    const wrapper = await createTestProvider()
    render(<ReleasesMenu button={ButtonTest} bundles={mockReleases} loading={false} />, {
      wrapper,
    })

    fireEvent.click(screen.getByRole('button', {name: 'Button Test'}))

    act(() => {
      userEvent.click(screen.getByTestId('release-spring-drop'))
      expect(setPerspective).toHaveBeenCalledWith('spring-drop')
    })
  })

  it('should render actions when actions prop is provided', async () => {
    const actions = <Button text="Actions" />

    const wrapper = await createTestProvider()
    render(
      <ReleasesMenu button={ButtonTest} bundles={mockReleases} loading={false} actions={actions} />,
      {
        wrapper,
      },
    )

    fireEvent.click(screen.getByRole('button', {name: 'Button Test'}))

    act(() => {
      expect(screen.getByRole('button', {name: 'Actions'})).toBeInTheDocument()
    })
  })

  it('should not show deleted bundles when not included in the list', async () => {
    mockUseReleases.mockReturnValue({
      dispatch: vi.fn(),
      loading: false,
      data: [],
      deletedReleases: {
        'mock-deleted-bundle': {
          _id: 'mock-deleted-bundle',
          _type: 'release',
          title: 'Mock Deleted Bundle',
        } as ReleaseDocument,
      },
    })
    const wrapper = await createTestProvider()
    render(<ReleasesMenu button={ButtonTest} bundles={mockReleases} loading={false} />, {
      wrapper,
    })

    fireEvent.click(screen.getByRole('button', {name: 'Button Test'}))

    expect(
      within(screen.getByTestId('bundles-list')).queryByText('Mock Deleted Bundle'),
    ).not.toBeInTheDocument()
  })

  it('should show deleted bundles that are included in the list', async () => {
    mockUseReleases.mockReturnValue({
      dispatch: vi.fn(),
      loading: false,
      data: [],
      deletedReleases: {
        'mock-deleted-bundle': {
          _id: 'mock-deleted-bundle',
          _type: 'release',
          title: 'Mock Deleted Bundle',
        } as ReleaseDocument,
      },
    })
    const wrapper = await createTestProvider()
    render(
      <ReleasesMenu
        button={ButtonTest}
        bundles={[
          ...mockReleases,
          {
            _id: 'mock-deleted-bundle',
            _type: 'release',
            title: 'Mock Deleted Bundle',
          } as ReleaseDocument,
        ]}
        loading={false}
      />,
      {
        wrapper,
      },
    )

    fireEvent.click(screen.getByRole('button', {name: 'Button Test'}))

    const allMenuBundles = within(screen.getByTestId('bundles-list')).getAllByRole('menuitem')
    // deleted should be at the end of the release list
    const [deletedBundle] = allMenuBundles.reverse()

    within(deletedBundle).getByText('Mock Deleted Bundle')
    expect(deletedBundle).toBeDisabled()
  })
})
