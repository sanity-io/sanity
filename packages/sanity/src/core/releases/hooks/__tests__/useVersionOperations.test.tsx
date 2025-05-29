import {act, renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {useVersionOperations} from '../useVersionOperations'

// Declare mock functions before vi.mock() calls to avoid hoisting issues
const mockUseReleaseOperations = vi.fn()
const mockUsePerspective = vi.fn()
const mockedUseSetPerspective = vi.fn()

vi.mock('../../store/useReleaseOperations', () => ({
  useReleaseOperations: mockUseReleaseOperations,
}))

vi.mock('../../../perspective/usePerspective', () => ({
  usePerspective: mockUsePerspective,
}))

vi.mock('../../../perspective/useSetPerspective', () => ({
  useSetPerspective: vi.fn(() => mockedUseSetPerspective),
}))

const defaultReleaseOperationsReturn = {
  createVersion: vi.fn(),
  discardVersion: vi.fn(),
  unpublishVersion: vi.fn(),
}

const defaultPerspectiveReturn = {
  selectedPerspective: null,
  selectedReleaseId: null,
}

describe('useVersionOperations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseReleaseOperations.mockReturnValue(defaultReleaseOperationsReturn)
    mockUsePerspective.mockReturnValue(defaultPerspectiveReturn)
  })

  it('should create a version successfully', async () => {
    const wrapper = await createTestProvider()
    const {result} = renderHook(() => useVersionOperations(), {wrapper})

    await act(async () => {
      await result.current.createVersion('releaseId', 'documentId')
    })

    expect(defaultReleaseOperationsReturn.createVersion).toHaveBeenCalledWith(
      'releaseId',
      'documentId',
      undefined,
    )
    expect(mockedUseSetPerspective).toHaveBeenCalledWith('releaseId')
  })

  it('should discard a version successfully', async () => {
    const wrapper = await createTestProvider()
    const {result} = renderHook(() => useVersionOperations(), {wrapper})

    await act(async () => {
      await result.current.discardVersion('releaseId', 'documentId')
    })

    expect(defaultReleaseOperationsReturn.discardVersion).toHaveBeenCalledWith(
      'releaseId',
      'documentId',
    )
  })

  it('should unpublish a version successfully', async () => {
    const wrapper = await createTestProvider()
    const {result} = renderHook(() => useVersionOperations(), {wrapper})

    await act(async () => {
      await result.current.unpublishVersion('versions.release.documentId')
    })

    expect(defaultReleaseOperationsReturn.unpublishVersion).toHaveBeenCalledWith(
      'versions.release.documentId',
    )
  })
})
