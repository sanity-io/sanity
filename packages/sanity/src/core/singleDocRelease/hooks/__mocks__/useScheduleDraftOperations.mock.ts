import {type Mock, type Mocked, vi} from 'vitest'

import {
  type ScheduleDraftOperationsValue,
  useScheduleDraftOperations,
} from '../useScheduleDraftOperations'

export const scheduleDraftOperationsMock: Mocked<ScheduleDraftOperationsValue> = {
  createScheduledDraft: vi.fn(),
  publishScheduledDraft: vi.fn(),
  deleteScheduledDraft: vi.fn(),
  rescheduleScheduledDraft: vi.fn(),
}

export const useScheduleDraftOperationsMockReturn = scheduleDraftOperationsMock

export const mockUseScheduleDraftOperations = useScheduleDraftOperations as Mock<
  typeof useScheduleDraftOperations
>
