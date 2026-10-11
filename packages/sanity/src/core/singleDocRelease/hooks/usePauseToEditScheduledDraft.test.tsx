import {act, renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it, type MockedFunction, vi} from 'vitest'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {usePauseToEditScheduledDraft} from './usePauseToEditScheduledDraft'
import {useScheduleDraftOperations} from './useScheduleDraftOperations'

vi.mock('./useScheduleDraftOperations', () => ({
  useScheduleDraftOperations: vi.fn(),
}))

const mockOperations = {
  publishScheduledDraft: vi.fn(),
  rescheduleScheduledDraft: vi.fn(),
  deleteScheduledDraft: vi.fn(),
  createScheduledDraft: vi.fn(),
  pauseScheduledDraft: vi.fn(),
}

const mockUseScheduleDraftOperations = useScheduleDraftOperations as MockedFunction<
  typeof useScheduleDraftOperations
>

describe('usePauseToEditScheduledDraft', () => {
  let TestProvider: React.ComponentType<{children: React.ReactNode}>

  beforeEach(async () => {
    vi.clearAllMocks()

    mockUseScheduleDraftOperations.mockReturnValue(mockOperations)
    mockOperations.pauseScheduledDraft.mockResolvedValue(undefined)

    TestProvider = await createTestProvider()
  })

  it('does not call the operation when release is undefined', async () => {
    const {result} = renderHook(() => usePauseToEditScheduledDraft({release: undefined}), {
      wrapper: TestProvider,
    })

    await act(async () => {
      await result.current.pauseToEdit()
    })

    expect(mockOperations.pauseScheduledDraft).not.toHaveBeenCalled()
  })
})
