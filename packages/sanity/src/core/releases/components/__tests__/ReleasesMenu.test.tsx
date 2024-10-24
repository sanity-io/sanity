import {fireEvent, render, screen, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {act} from 'react'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {Button} from '../../../../ui-components'
import {type ReleaseDocument, useReleases} from '../../../store'
import {RELEASE_DOCUMENT_TYPE} from '../../../store/release/constants'
import {usePerspective} from '../../hooks/usePerspective'
import {LATEST} from '../../util/const'
import {ReleasesMenu} from '../ReleasesMenu'

vi.mock('../../hooks/usePerspective', () => ({
  usePerspective: vi.fn().mockReturnValue({
    currentGlobalBundle: {},
    setPerspectiveFromRelease: vi.fn(),
  }),
}))

vi.mock('../../util/util', () => ({
  isDraftOrPublished: vi.fn(),
}))

vi.mock('../../../store/release/useReleases', () => ({
  useReleases: vi.fn().mockReturnValue({deletedReleases: {}}),
}))

const mockUseReleases = useReleases as Mock<typeof useReleases>

const TEST_RELEASE: ReleaseDocument = {
  _id: 'some-id',
  _type: RELEASE_DOCUMENT_TYPE,
  // yesterday
  _createdAt: '2024-10-22T13:18:59.207Z',
  _updatedAt: '2024-10-22T13:18:59.207Z',
  name: 'Release Foo',
  state: 'active',
  finalDocumentStates: [],
  createdBy: 'User 1',
  metadata: {
    icon: 'drop',
    description: '',
    title: '',
    releaseType: 'asap',
    hue: 'magenta',
  },
}

describe('ReleasesMenu', () => {
  const mockUsePerspective = usePerspective as Mock
  const ButtonTest = <Button text="Button Test" />
  const mockReleases: ReleaseDocument[] = [
    {
      ...TEST_RELEASE,
      _id: 'spring-drop',
      metadata: {
        ...TEST_RELEASE.metadata,
        description: 'What a spring drop, allergies galore 🌸',
        title: 'Spring Drop',
      },
    },
    {
      ...TEST_RELEASE,
      _id: 'autumn-drop',
      metadata: {
        ...TEST_RELEASE.metadata,
        icon: 'drop',
        title: 'Autumn Drop',
        hue: 'yellow',
        releaseType: 'asap',
      },
    },
    {
      ...TEST_RELEASE,
      _id: 'f6b2c2cc-1732-4465-bfb3-dd205b5d78e9',
      metadata: {
        ...TEST_RELEASE.metadata,
        title: 'Summer Drop',
        hue: 'red',
        createdBy: '',
        releaseType: 'asap',
      },
    },
  ]

  beforeEach(() => {
    mockUsePerspective.mockClear()
  })

  it('should render loading spinner when loading is true', async () => {
    const wrapper = await createTestProvider()
    render(<ReleasesMenu button={ButtonTest} releases={[]} loading />, {
      wrapper,
    })

    expect(screen.getByRole('button', {name: 'Button Test'})).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: 'Button Test'}))

    act(() => {
      expect(screen.getByTestId('release-menu')).toBeInTheDocument()
      expect(screen.getByTestId('spinner')).toBeInTheDocument()
    })
  })

  it('should render latest release menu item when releases are null', async () => {
    const wrapper = await createTestProvider()
    render(<ReleasesMenu button={ButtonTest} releases={null} loading={false} />, {
      wrapper,
    })

    fireEvent.click(screen.getByRole('button', {name: 'Button Test'}))

    act(() => {
      expect(screen.getByTestId('latest-menu-item')).toBeInTheDocument()
      expect(screen.queryByTestId('releases-list')).not.toBeInTheDocument()
    })
  })

  it('should render latest release menu item when releases are archived', async () => {
    const wrapper = await createTestProvider()
    const archivedBundles = mockReleases.map(
      (release): ReleaseDocument => ({
        ...release,
        state: 'archived',
      }),
    )
    render(<ReleasesMenu button={ButtonTest} releases={archivedBundles} loading={false} />, {
      wrapper,
    })

    fireEvent.click(screen.getByRole('button', {name: 'Button Test'}))

    act(() => {
      expect(screen.getByTestId('latest-menu-item')).toBeInTheDocument()
      expect(screen.queryByTestId('releases-list')).not.toBeInTheDocument()
    })
  })

  it('should render latest release menu item as selected when currentGlobalBundle is LATEST', async () => {
    mockUsePerspective.mockReturnValue({
      currentGlobalBundle: LATEST,
      setPerspectiveFromRelease: vi.fn(),
    })

    const wrapper = await createTestProvider()
    render(<ReleasesMenu button={ButtonTest} releases={[]} loading={false} />, {
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
      setPerspectiveFromRelease: vi.fn(),
    })

    const wrapper = await createTestProvider()
    render(<ReleasesMenu button={ButtonTest} releases={mockReleases} loading={false} />, {
      wrapper,
    })

    fireEvent.click(screen.getByRole('button', {name: 'Button Test'}))

    act(() => {
      expect(screen.getByText(mockReleases[0].metadata.title)).toBeInTheDocument()
      expect(screen.getByTestId(`${mockReleases[0]._id}-checkmark-icon`)).toBeInTheDocument()
    })
  })

  it('should render release menu items when releases are provided', async () => {
    const wrapper = await createTestProvider()
    render(<ReleasesMenu button={ButtonTest} releases={mockReleases} loading={false} />, {
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
    const setPerspectiveFromRelease = vi.fn()
    mockUsePerspective.mockReturnValue({
      currentGlobalBundle: LATEST,
      setPerspectiveFromRelease,
    })

    const wrapper = await createTestProvider()
    render(<ReleasesMenu button={ButtonTest} releases={mockReleases} loading={false} />, {
      wrapper,
    })

    fireEvent.click(screen.getByRole('button', {name: 'Button Test'}))

    act(() => {
      userEvent.click(screen.getByTestId('release-spring-drop'))
      expect(setPerspectiveFromRelease).toHaveBeenCalledWith('spring-drop')
    })
  })

  it('should render actions when actions prop is provided', async () => {
    const actions = <Button text="Actions" />

    const wrapper = await createTestProvider()
    render(
      <ReleasesMenu
        button={ButtonTest}
        releases={mockReleases}
        loading={false}
        actions={actions}
      />,
      {
        wrapper,
      },
    )

    fireEvent.click(screen.getByRole('button', {name: 'Button Test'}))

    act(() => {
      expect(screen.getByRole('button', {name: 'Actions'})).toBeInTheDocument()
    })
  })

  it('should not show deleted releases when not included in the list', async () => {
    mockUseReleases.mockReturnValue({
      dispatch: vi.fn(),
      loading: false,
      data: [],
      deletedReleases: {
        'mock-deleted-release': {
          _id: 'mock-deleted-release',
          _type: 'system-tmp.release',
          metadata: {
            title: 'Mock Deleted Bundle',
          },
        } as ReleaseDocument,
      },
    })
    const wrapper = await createTestProvider()
    render(<ReleasesMenu button={ButtonTest} releases={mockReleases} loading={false} />, {
      wrapper,
    })

    fireEvent.click(screen.getByRole('button', {name: 'Button Test'}))

    expect(
      within(screen.getByTestId('releases-list')).queryByText('Mock Deleted Bundle'),
    ).not.toBeInTheDocument()
  })

  it('should show deleted releases that are included in the list', async () => {
    mockUseReleases.mockReturnValue({
      dispatch: vi.fn(),
      loading: false,
      data: [],
      deletedReleases: {
        'mock-deleted-release': {
          _id: 'mock-deleted-release',
          _type: 'system-tmp.release',
          metadata: {
            title: 'Mock Deleted Bundle',
          },
        } as ReleaseDocument,
      },
    })
    const wrapper = await createTestProvider()
    render(
      <ReleasesMenu
        button={ButtonTest}
        releases={[
          ...mockReleases,
          {
            _id: 'mock-deleted-release',
            _type: 'system-tmp.release',
            metadata: {
              title: 'Mock Deleted Bundle',
            },
          } as ReleaseDocument,
        ]}
        loading={false}
      />,
      {
        wrapper,
      },
    )

    fireEvent.click(screen.getByRole('button', {name: 'Button Test'}))

    const allMenuBundles = within(screen.getByTestId('releases-list')).getAllByRole('menuitem')
    // deleted should be at the end of the release list
    const [deletedBundle] = allMenuBundles.reverse()

    within(deletedBundle).getByText('Mock Deleted Bundle')
    expect(deletedBundle).toBeDisabled()
  })
})
