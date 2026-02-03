import {renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {type ReleaseActionComponent} from '../../../config/releases/actions'
import {type Source} from '../../../config/types'
import {useSource} from '../../../studio'
import {activeASAPRelease} from '../../__fixtures__/release.fixture'
import {documentsInRelease} from '../../tool/detail/__tests__/__mocks__/useBundleDocuments.mock'
import {type DocumentInRelease} from '../../tool/detail/useBundleDocuments'
import {useCustomReleaseActions} from '../useCustomReleaseActions'

vi.mock('../../../studio', () => ({
  useSource: vi.fn(),
}))

const mockedUseSource = vi.mocked(useSource)

function createMockSource(releases?: Partial<NonNullable<Source['releases']>>): Source {
  if (!releases) {
    return {releases: undefined} as Source
  }

  return {
    releases: {
      enabled: true,
      actions: vi.fn().mockReturnValue([]),
      ...releases,
    },
  } as Source
}

describe('useCustomReleaseActions', () => {
  const mockRelease = activeASAPRelease
  const mockDocuments = [documentsInRelease]

  const mockReleaseActions: ReleaseActionComponent[] = [
    vi.fn(() => ({
      label: 'Custom Action 1',
      onHandle: vi.fn(),
    })),
    vi.fn(() => ({
      label: 'Custom Action 2',
      onHandle: vi.fn(),
    })),
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return empty array when source.releases.actions is not defined', () => {
    mockedUseSource.mockReturnValue(createMockSource())

    const {result} = renderHook(() => useCustomReleaseActions(mockRelease, mockDocuments))

    expect(result.current).toEqual([])
  })

  it('should return empty array when source.releases is not defined', () => {
    mockedUseSource.mockReturnValue(createMockSource())

    const {result} = renderHook(() => useCustomReleaseActions(mockRelease, mockDocuments))

    expect(result.current).toEqual([])
  })

  it('should call source.releases.actions with release and documents when defined', () => {
    const mockReturnValue = mockReleaseActions.map((action) =>
      action({release: mockRelease, documents: mockDocuments}),
    )
    const mockActionsFunction = vi.fn().mockReturnValue(mockReturnValue)

    mockedUseSource.mockReturnValue(
      createMockSource({
        actions: mockActionsFunction,
      }),
    )

    const {result} = renderHook(() => useCustomReleaseActions(mockRelease, mockDocuments))

    expect(mockActionsFunction).toHaveBeenCalledWith({
      release: mockRelease,
      documents: mockDocuments,
    })
    expect(result.current).toEqual(mockReturnValue)
  })

  it('should call source.releases.actions with empty documents array when documents not provided', () => {
    const mockActionsFunction = vi.fn().mockReturnValue(mockReleaseActions)

    mockedUseSource.mockReturnValue(
      createMockSource({
        actions: mockActionsFunction,
      }),
    )

    const {result} = renderHook(() => useCustomReleaseActions(mockRelease))

    expect(mockActionsFunction).toHaveBeenCalledWith({
      release: mockRelease,
      documents: [],
    })
    expect(result.current).toEqual(mockReleaseActions)
  })

  it('should memoize the result and not call actions function again on re-render with same inputs', () => {
    const mockActionsFunction = vi.fn().mockReturnValue(mockReleaseActions)

    mockedUseSource.mockReturnValue(
      createMockSource({
        actions: mockActionsFunction,
      }),
    )

    const {result, rerender} = renderHook(() => useCustomReleaseActions(mockRelease, mockDocuments))

    expect(mockActionsFunction).toHaveBeenCalledTimes(1)
    expect(result.current).toEqual(mockReleaseActions)

    // Re-render with same inputs
    rerender()

    expect(mockActionsFunction).toHaveBeenCalledTimes(1) // Should not be called again
    expect(result.current).toEqual(mockReleaseActions)
  })

  it('should call actions function again when release changes', () => {
    const mockActionsFunction = vi.fn().mockReturnValue(mockReleaseActions)

    mockedUseSource.mockReturnValue(
      createMockSource({
        actions: mockActionsFunction,
      }),
    )

    const {rerender} = renderHook((release) => useCustomReleaseActions(release, mockDocuments), {
      initialProps: mockRelease,
    })

    expect(mockActionsFunction).toHaveBeenCalledTimes(1)

    const newMockRelease = {
      ...mockRelease,
      _id: '_.releases.different-release',
      name: 'different-release',
      metadata: {
        ...mockRelease.metadata,
        title: 'Different Release',
      },
    }

    // Re-render with different release
    rerender(newMockRelease)

    expect(mockActionsFunction).toHaveBeenCalledTimes(2)
    expect(mockActionsFunction).toHaveBeenLastCalledWith({
      release: newMockRelease,
      documents: mockDocuments,
    })
  })

  it('should call actions function again when documents change', () => {
    const mockActionsFunction = vi.fn().mockReturnValue(mockReleaseActions)

    mockedUseSource.mockReturnValue(
      createMockSource({
        actions: mockActionsFunction,
      }),
    )

    const {rerender} = renderHook((documents) => useCustomReleaseActions(mockRelease, documents), {
      initialProps: mockDocuments,
    })

    expect(mockActionsFunction).toHaveBeenCalledTimes(1)

    const newMockDocuments = [
      ...mockDocuments,
      {
        _id: 'doc3',
        _type: 'document',
        title: 'Document 3',
      },
    ] as DocumentInRelease[]
    rerender(newMockDocuments)

    expect(mockActionsFunction).toHaveBeenCalledTimes(2)
    expect(mockActionsFunction).toHaveBeenLastCalledWith({
      release: mockRelease,
      documents: newMockDocuments,
    })
  })

  it('should call actions function again when source changes', () => {
    const mockActionsFunction1 = vi.fn().mockReturnValue(mockReleaseActions)
    const mockActionsFunction2 = vi.fn().mockReturnValue([])

    mockedUseSource.mockReturnValueOnce(
      createMockSource({
        actions: mockActionsFunction1,
      }),
    )

    const {result, rerender} = renderHook(() => useCustomReleaseActions(mockRelease, mockDocuments))

    expect(mockActionsFunction1).toHaveBeenCalledTimes(1)
    expect(result.current).toEqual(mockReleaseActions)

    // Change the source
    mockedUseSource.mockReturnValueOnce(
      createMockSource({
        actions: mockActionsFunction2,
      }),
    )

    rerender()

    expect(mockActionsFunction2).toHaveBeenCalledTimes(1)
    expect(result.current).toEqual([])
  })
})
