import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {Button} from '@sanity/ui'
import {fireEvent, render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {act} from 'react'
import {type BundleDocument} from 'sanity'

import {createWrapper} from '../../../../../test/testUtils/createWrapper'
import {usePerspective} from '../../hooks/usePerspective'
import {LATEST} from '../../util/const'
import {BundleMenu} from '../BundleMenu'

jest.mock('../../hooks/usePerspective', () => ({
  usePerspective: jest.fn().mockReturnValue({
    currentGlobalBundle: {},
    setPerspective: jest.fn(),
  }),
}))

jest.mock('../../util/dummyGetters', () => ({
  isDraftOrPublished: jest.fn(),
}))

describe('BundleMenu', () => {
  const mockUsePerspective = usePerspective as jest.Mock
  const ButtonTest = <Button>Button Test</Button>
  const mockBundles: BundleDocument[] = [
    {
      hue: 'magenta',
      _id: 'db76c50e-358b-445c-a57c-8344c588a5d5',
      _type: 'bundle',
      slug: 'spring-drop',
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
      _type: 'bundle',
      hue: 'yellow',
      _id: '0e87530e-4378-45ff-9d6f-58207e89f3ed',
      _createdAt: '2024-07-02T11:37:06Z',
      _rev: '6z08CvvPnPe5pWSKJ5zJiK',
      _updatedAt: '2024-07-02T11:37:06Z',
      slug: 'autumn-drop',
      authorId: '',
    },
    {
      _createdAt: '2024-07-02T11:36:00Z',
      _rev: '22LTUf6tptoEq53N9U5CzE',
      icon: 'sun',
      description: 'What a summer drop woo hoo! ☀️',
      _updatedAt: '2024-07-02T11:36:00Z',
      title: 'Summer Drop',
      _type: 'bundle',
      hue: 'red',
      _id: 'f6b2c2cc-1732-4465-bfb3-dd205b5d78e9',
      slug: 'summer-drop',
      authorId: '',
    },
  ]

  beforeEach(() => {
    mockUsePerspective.mockClear()
  })

  it('should render loading spinner when loading is true', async () => {
    const wrapper = await createWrapper()
    render(<BundleMenu button={ButtonTest} bundles={[]} loading />, {
      wrapper,
    })

    expect(screen.getByRole('button', {name: 'Button Test'})).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: 'Button Test'}))

    act(() => {
      expect(screen.getByTestId('bundle-menu')).toBeInTheDocument()
      expect(screen.getByTestId('spinner')).toBeInTheDocument()
    })
  })

  it('should render latest bundle menu item when bundles are null', async () => {
    const wrapper = await createWrapper()
    render(<BundleMenu button={ButtonTest} bundles={null} loading={false} />, {
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

    const wrapper = await createWrapper()
    render(<BundleMenu button={ButtonTest} bundles={[]} loading={false} />, {
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

    const wrapper = await createWrapper()
    render(<BundleMenu button={ButtonTest} bundles={mockBundles} loading={false} />, {
      wrapper,
    })

    fireEvent.click(screen.getByRole('button', {name: 'Button Test'}))

    act(() => {
      expect(screen.getByText(mockBundles[0].title)).toBeInTheDocument()
      expect(screen.getByTestId(`${mockBundles[0].slug}-checkmark-icon`)).toBeInTheDocument()
    })
  })

  it('should render bundle menu items when bundles are provided', async () => {
    const wrapper = await createWrapper()
    render(<BundleMenu button={ButtonTest} bundles={mockBundles} loading={false} />, {
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

    const wrapper = await createWrapper()
    render(<BundleMenu button={ButtonTest} bundles={mockBundles} loading={false} />, {
      wrapper,
    })

    fireEvent.click(screen.getByRole('button', {name: 'Button Test'}))

    act(() => {
      userEvent.click(screen.getByTestId('bundle-spring-drop'))
      expect(setPerspective).toHaveBeenCalledWith('spring-drop')
    })
  })

  it('should render actions when actions prop is provided', async () => {
    const actions = <Button>Actions</Button>

    const wrapper = await createWrapper()
    render(
      <BundleMenu button={ButtonTest} bundles={mockBundles} loading={false} actions={actions} />,
      {
        wrapper,
      },
    )

    fireEvent.click(screen.getByRole('button', {name: 'Button Test'}))

    act(() => {
      expect(screen.getByRole('button', {name: 'Actions'})).toBeInTheDocument()
    })
  })
})
