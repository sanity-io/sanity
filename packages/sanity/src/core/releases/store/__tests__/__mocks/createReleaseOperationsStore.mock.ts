import {type Mock, type Mocked, vi} from 'vitest'

import {
  createReleaseOperationsStore,
  type ReleaseOperationsStore,
} from '../../createReleaseOperationStore'

export const createReleaseOperationsStoreReturn: Mocked<ReleaseOperationsStore> = {
  archive: vi.fn(),
  unarchive: vi.fn(),
  createRelease: vi.fn(),
  createVersion: vi.fn(),
  publishRelease: vi.fn(),
  schedule: vi.fn(),
  unschedule: vi.fn(),
  updateRelease: vi.fn(),
  deleteRelease: vi.fn(),
  revertRelease: vi.fn(),
  duplicateRelease: vi.fn(),
  revertUnpublishVersion: vi.fn(),
}

export const mockCreateReleaseOperationsStore = createReleaseOperationsStore as Mock<
  typeof createReleaseOperationsStore
>
