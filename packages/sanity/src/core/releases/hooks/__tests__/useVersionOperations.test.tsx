import {act, renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {usePerspectiveMockReturn} from '../../../perspective/__mocks__/usePerspective.mock'
import {useReleaseOperationsMockReturn} from '../../store/__tests__/__mocks/useReleaseOperations.mock'
import {useVersionOperations} from '../useVersionOperations'

vi.mock('../../store/useReleaseOperations', () => ({
  useReleaseOperations: vi.fn(() => useReleaseOperationsMockReturn),
}))

vi.mock('../../../perspective/usePerspective', () => ({
  usePerspective: vi.fn(() => usePerspectiveMockReturn),
}))

const mockedUseSetPerspective = vi.fn()
vi.mock('../../../perspective/useSetPerspective', () => ({
  useSetPerspective: vi.fn(() => mockedUseSetPerspective),
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
    expect(mockedUseSetPerspective).toHaveBeenCalledWith('releaseId')
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

  it('should unpublish a version successfully', async () => {
    const wrapper = await createTestProvider()
    const {result} = renderHook(() => useVersionOperations(), {wrapper})

    await act(async () => {
      await result.current.unpublishVersion('versions.release.documentId')
    })

    expect(useReleaseOperationsMockReturn.unpublishVersion).toHaveBeenCalledWith(
      'versions.release.documentId',
    )
  })
})
