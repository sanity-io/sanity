import {type Mocked, vi} from 'vitest'

import {type ReleaseOperationsStore} from '../../createReleaseOperationStore'

export const useReleaseOperationsMock: Mocked<ReleaseOperationsStore> = {
  archive: vi.fn(),
  unarchive: vi.fn(),
  createRelease: vi.fn(),
  createVersion: vi.fn(),
  discardVersion: vi.fn(),
  publishRelease: vi.fn(),
  schedule: vi.fn(),
  unschedule: vi.fn(),
  updateRelease: vi.fn(),
}
