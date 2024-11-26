import {act, renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {useReleaseOperationsMockReturn} from '../../store/__tests__/__mocks/useReleaseOperations.mock'
import {useVersionOperations} from '../useVersionOperations'
import {usePerspectiveMockReturn} from './__mocks__/usePerspective.mock'

vi.mock('../../store/useReleaseOperations', () => ({
  useReleaseOperations: vi.fn(() => useReleaseOperationsMockReturn),
}))

vi.mock('../usePerspective', () => ({
  usePerspective: vi.fn(() => usePerspectiveMockReturn),
}))

describe('useVersionOperations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create a version successfully', async () => {
    const wrapper = await createTestProvider()
    const {result} = renderHook(() => useVersionOperations(), {wrapper})

    await act(async () => {
      await result.current.createVersion('releaseId', 'documentId')
    })

    expect(useReleaseOperationsMockReturn.createVersion).toHaveBeenCalledWith(
      'releaseId',
      'documentId',
      undefined,
    )
    expect(usePerspectiveMockReturn.setPerspectiveFromReleaseId).toHaveBeenCalledWith('releaseId')
  })

  it('should discard a version successfully', async () => {
    const wrapper = await createTestProvider()
    const {result} = renderHook(() => useVersionOperations(), {wrapper})

    await act(async () => {
      await result.current.discardVersion('releaseId', 'documentId')
    })

    expect(useReleaseOperationsMockReturn.discardVersion).toHaveBeenCalledWith(
      'releaseId',
      'documentId',
    )
  })
})
