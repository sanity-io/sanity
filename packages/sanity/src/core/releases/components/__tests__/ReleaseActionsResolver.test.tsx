import {render} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {GetHookCollectionState} from '../../../components/hookCollection'
import {
  type ReleaseActionComponent,
  type ReleaseActionDescription,
} from '../../../config/releases/actions'
import {activeASAPRelease} from '../../__fixtures__/release.fixture'
import {documentsInRelease} from '../../tool/detail/__tests__/__mocks__/useBundleDocuments.mock'
import {ReleaseActionsResolver} from '../ReleaseActionsResolver'

vi.mock('../../../components/hookCollection', () => ({
  GetHookCollectionState: vi.fn(({children, hooks, args}) => {
    const states = hooks.map((hook: ReleaseActionComponent) => hook(args)).filter(Boolean)
    return children({states})
  }),
}))

const mockedGetHookCollectionState = vi.mocked(GetHookCollectionState)

describe('ReleaseActionsResolver', () => {
  const mockRelease = activeASAPRelease
  const mockDocuments = [documentsInRelease]

  const mockReleaseActionDescription1: ReleaseActionDescription = {
    label: 'Custom Action 1',
    onHandle: vi.fn(),
    disabled: false,
  }

  const mockReleaseActionDescription2: ReleaseActionDescription = {
    label: 'Custom Action 2',
    onHandle: vi.fn(),
    disabled: true,
    title: 'This action is disabled',
  }

  const mockReleaseAction1: ReleaseActionComponent = vi.fn(() => mockReleaseActionDescription1)
  const mockReleaseAction2: ReleaseActionComponent = vi.fn(() => mockReleaseActionDescription2)
  const mockReleaseAction3: ReleaseActionComponent = vi.fn(
    () => null as unknown as ReleaseActionDescription,
  )

  const mockOnActions = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render without crashing with empty actions', () => {
    const {container} = render(
      <ReleaseActionsResolver
        actions={[]}
        release={mockRelease}
        documents={mockDocuments}
        onActions={mockOnActions}
      />,
    )

    expect(container).toBeDefined()
    expect(mockedGetHookCollectionState).toHaveBeenCalledWith(
      expect.objectContaining({
        hooks: [],
        args: {
          release: mockRelease,
          documents: mockDocuments,
        },
      }),
      undefined,
    )
  })

  it('should call onActions with resolved action states', () => {
    render(
      <ReleaseActionsResolver
        actions={[mockReleaseAction1, mockReleaseAction2]}
        release={mockRelease}
        documents={mockDocuments}
        onActions={mockOnActions}
      />,
    )

    expect(mockOnActions).toHaveBeenCalledWith([
      mockReleaseActionDescription1,
      mockReleaseActionDescription2,
    ])
  })

  it('should filter out null action results', () => {
    render(
      <ReleaseActionsResolver
        actions={[mockReleaseAction1, mockReleaseAction3, mockReleaseAction2]}
        release={mockRelease}
        documents={mockDocuments}
        onActions={mockOnActions}
      />,
    )

    expect(mockOnActions).toHaveBeenCalledWith([
      mockReleaseActionDescription1,
      mockReleaseActionDescription2,
    ])
  })

  it('should pass correct props to action components', () => {
    render(
      <ReleaseActionsResolver
        actions={[mockReleaseAction1]}
        release={mockRelease}
        documents={mockDocuments}
        onActions={mockOnActions}
      />,
    )

    expect(mockReleaseAction1).toHaveBeenCalledWith({
      release: mockRelease,
      documents: mockDocuments,
    })
  })

  it('should call GetHookCollectionState with correct props', () => {
    render(
      <ReleaseActionsResolver
        actions={[mockReleaseAction1, mockReleaseAction2]}
        release={mockRelease}
        documents={mockDocuments}
        onActions={mockOnActions}
      />,
    )

    expect(mockedGetHookCollectionState).toHaveBeenCalledWith(
      expect.objectContaining({
        hooks: [mockReleaseAction1, mockReleaseAction2],
        args: {
          release: mockRelease,
          documents: mockDocuments,
        },
      }),
      undefined,
    )
  })

  it('should render children when provided', () => {
    const mockChildren = vi.fn(() => <div data-testid="custom-children">Custom Content</div>)

    const {getByTestId} = render(
      <ReleaseActionsResolver
        actions={[mockReleaseAction1]}
        release={mockRelease}
        documents={mockDocuments}
        onActions={mockOnActions}
      >
        {mockChildren}
      </ReleaseActionsResolver>,
    )

    expect(getByTestId('custom-children')).toBeInTheDocument()
    expect(mockChildren).toHaveBeenCalledWith({
      states: [mockReleaseActionDescription1],
    })
  })

  it('should handle empty actions array', () => {
    render(
      <ReleaseActionsResolver
        actions={[]}
        release={mockRelease}
        documents={mockDocuments}
        onActions={mockOnActions}
      />,
    )

    expect(mockOnActions).toHaveBeenCalledWith([])
  })

  it('should handle all actions returning null', () => {
    const nullAction1: ReleaseActionComponent = vi.fn(
      () => null as unknown as ReleaseActionDescription,
    )
    const nullAction2: ReleaseActionComponent = vi.fn(
      () => null as unknown as ReleaseActionDescription,
    )

    render(
      <ReleaseActionsResolver
        actions={[nullAction1, nullAction2]}
        release={mockRelease}
        documents={mockDocuments}
        onActions={mockOnActions}
      />,
    )

    expect(mockOnActions).toHaveBeenCalledWith([])
  })

  it('should handle re-render with same props', () => {
    const {rerender} = render(
      <ReleaseActionsResolver
        actions={[mockReleaseAction1]}
        release={mockRelease}
        documents={mockDocuments}
        onActions={mockOnActions}
      />,
    )

    expect(mockOnActions).toHaveBeenCalledWith([mockReleaseActionDescription1])

    // Clear previous calls
    vi.clearAllMocks()

    // Re-render with same props
    rerender(
      <ReleaseActionsResolver
        actions={[mockReleaseAction1]}
        release={mockRelease}
        documents={mockDocuments}
        onActions={mockOnActions}
      />,
    )

    // Should still call onActions with the same result
    expect(mockOnActions).toHaveBeenCalledWith([mockReleaseActionDescription1])
  })

  it('should update when release changes', () => {
    const newRelease = {
      ...mockRelease,
      _id: '_.releases.different-release',
      name: 'different-release',
    }

    const {rerender} = render(
      <ReleaseActionsResolver
        actions={[mockReleaseAction1]}
        release={mockRelease}
        documents={mockDocuments}
        onActions={mockOnActions}
      />,
    )

    // Clear previous calls
    vi.clearAllMocks()

    // Re-render with different release
    rerender(
      <ReleaseActionsResolver
        actions={[mockReleaseAction1]}
        release={newRelease}
        documents={mockDocuments}
        onActions={mockOnActions}
      />,
    )

    expect(mockReleaseAction1).toHaveBeenCalledWith({
      release: newRelease,
      documents: mockDocuments,
    })
  })

  it('should update when documents change', () => {
    const newDocuments = [
      ...mockDocuments,
      {
        ...documentsInRelease,
        memoKey: 'doc3',
        document: {
          ...documentsInRelease.document,
          _id: 'doc3',
        },
      },
    ]

    const {rerender} = render(
      <ReleaseActionsResolver
        actions={[mockReleaseAction1]}
        release={mockRelease}
        documents={mockDocuments}
        onActions={mockOnActions}
      />,
    )

    // Clear previous calls
    vi.clearAllMocks()

    // Re-render with different documents
    rerender(
      <ReleaseActionsResolver
        actions={[mockReleaseAction1]}
        release={mockRelease}
        documents={newDocuments}
        onActions={mockOnActions}
      />,
    )

    expect(mockReleaseAction1).toHaveBeenCalledWith({
      release: mockRelease,
      documents: newDocuments,
    })
  })
})
