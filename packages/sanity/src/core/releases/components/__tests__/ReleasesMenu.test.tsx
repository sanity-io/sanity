import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {fireEvent, render, screen, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {act} from 'react'
import {type BundleDocument, useBundles} from 'sanity'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {Button} from '../../../../ui-components'
import {usePerspective} from '../../hooks'
import {LATEST} from '../../util/const'
import {ReleasesMenu} from '../ReleasesMenu'

jest.mock('../../hooks', () => ({
  usePerspective: jest.fn().mockReturnValue({
    currentGlobalBundle: {},
    setPerspective: jest.fn(),
  }),
}))

jest.mock('../..//util/util', () => ({
  isDraftOrPublished: jest.fn(),
}))

jest.mock('../../../store/bundles/useBundles', () => ({
  useBundles: jest.fn().mockReturnValue({deletedBundles: {}}),
}))

const mockUseBundles = useBundles as jest.Mock<typeof useBundles>

describe('ReleasesMenu', () => {
  const mockUsePerspective = usePerspective as jest.Mock
  const ButtonTest = <Button text="Button Test" />
  const mockBundles: BundleDocument[] = [
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
      authorId: '',
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
      authorId: '',
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
      authorId: '',
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

  it('should render latest bundle menu item when bundles are null', async () => {
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

  it('should render latest bundle menu item when bundles are archived', async () => {
    const wrapper = await createTestProvider()
    const archivedBundles = mockBundles.map((bundle) => ({
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

  it('should render latest bundle menu item as selected when currentGlobalBundle is LATEST', async () => {
    mockUsePerspective.mockReturnValue({
      currentGlobalBundle: LATEST,
      setPerspective: jest.fn(),
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

  it('should render bundle as selected when currentGlobalBundle is that bundle', async () => {
    mockUsePerspective.mockReturnValue({
      currentGlobalBundle: mockBundles[0],
      setPerspective: jest.fn(),
    })

    const wrapper = await createTestProvider()
    render(<ReleasesMenu button={ButtonTest} bundles={mockBundles} loading={false} />, {
      wrapper,
    })

    fireEvent.click(screen.getByRole('button', {name: 'Button Test'}))

    act(() => {
      expect(screen.getByText(mockBundles[0].title)).toBeInTheDocument()
      expect(screen.getByTestId(`${mockBundles[0]._id}-checkmark-icon`)).toBeInTheDocument()
    })
  })

  it('should render bundle menu items when bundles are provided', async () => {
    const wrapper = await createTestProvider()
    render(<ReleasesMenu button={ButtonTest} bundles={mockBundles} loading={false} />, {
      wrapper,
    })

    fireEvent.click(screen.getByRole('button', {name: 'Button Test'}))

    act(() => {
      expect(screen.getByText('Spring Drop')).toBeInTheDocument()
      expect(screen.getByText('Autumn Drop')).toBeInTheDocument()
      expect(screen.getByText('Summer Drop')).toBeInTheDocument()
    })
  })

  it('should call setPerspective when a bundle menu item is clicked', async () => {
    const setPerspective = jest.fn()
    mockUsePerspective.mockReturnValue({
      currentGlobalBundle: LATEST,
      setPerspective,
    })

    const wrapper = await createTestProvider()
    render(<ReleasesMenu button={ButtonTest} bundles={mockBundles} loading={false} />, {
      wrapper,
    })

    fireEvent.click(screen.getByRole('button', {name: 'Button Test'}))

    act(() => {
      userEvent.click(screen.getByTestId('bundle-spring-drop'))
      expect(setPerspective).toHaveBeenCalledWith('spring-drop')
    })
  })

  it('should render actions when actions prop is provided', async () => {
    const actions = <Button text="Actions" />

    const wrapper = await createTestProvider()
    render(
      <ReleasesMenu button={ButtonTest} bundles={mockBundles} loading={false} actions={actions} />,
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
    mockUseBundles.mockReturnValue({
      dispatch: jest.fn(),
      loading: false,
      data: [],
      deletedBundles: {
        'mock-deleted-bundle': {
          _id: 'mock-deleted-bundle',
          _type: 'release',
          title: 'Mock Deleted Bundle',
        } as BundleDocument,
      },
    })
    const wrapper = await createTestProvider()
    render(<ReleasesMenu button={ButtonTest} bundles={mockBundles} loading={false} />, {
      wrapper,
    })

    fireEvent.click(screen.getByRole('button', {name: 'Button Test'}))

    expect(
      within(screen.getByTestId('bundles-list')).queryByText('Mock Deleted Bundle'),
    ).not.toBeInTheDocument()
  })

  it('should show deleted bundles that are included in the list', async () => {
    mockUseBundles.mockReturnValue({
      dispatch: jest.fn(),
      loading: false,
      data: [],
      deletedBundles: {
        'mock-deleted-bundle': {
          _id: 'mock-deleted-bundle',
          _type: 'release',
          title: 'Mock Deleted Bundle',
        } as BundleDocument,
      },
    })
    const wrapper = await createTestProvider()
    render(
      <ReleasesMenu
        button={ButtonTest}
        bundles={[
          ...mockBundles,
          {
            _id: 'mock-deleted-bundle',
            _type: 'release',
            title: 'Mock Deleted Bundle',
          } as BundleDocument,
        ]}
        loading={false}
      />,
      {
        wrapper,
      },
    )

    fireEvent.click(screen.getByRole('button', {name: 'Button Test'}))

    const allMenuBundles = within(screen.getByTestId('bundles-list')).getAllByRole('menuitem')
    // deleted should be at the end of the bundle list
    const [deletedBundle] = allMenuBundles.reverse()

    within(deletedBundle).getByText('Mock Deleted Bundle')
    expect(deletedBundle).toBeDisabled()
  })
})
