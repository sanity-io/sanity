import {type Mock, type Mocked, vi} from 'vitest'

import {type ReleaseOperationsStore} from '../../createReleaseOperationStore'
import {useReleaseOperations} from '../../useReleaseOperations'

export const useReleaseOperationsMockReturn: Mocked<ReleaseOperationsStore> = {
  archive: vi.fn(),
  unarchive: vi.fn(),
  createRelease: vi.fn(),
  createVersion: vi.fn(),
  discardVersion: vi.fn(),
  publishRelease: vi.fn(),
  schedule: vi.fn(),
  unschedule: vi.fn(),
  updateRelease: vi.fn(),
  deleteRelease: vi.fn(),
  revertRelease: vi.fn(),
  unpublishVersion: vi.fn(),
}

export const mockUseReleaseOperations = useReleaseOperations as Mock<typeof useReleaseOperations>
