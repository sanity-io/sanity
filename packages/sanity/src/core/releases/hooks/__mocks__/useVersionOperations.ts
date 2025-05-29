import {type Mock, type Mocked, vi} from 'vitest'

import {type VersionOperationsValue} from '../useVersionOperations'

export const useVersionOperationsReturn: Mocked<VersionOperationsValue> = {
  createVersion: vi.fn(),
  discardVersion: vi.fn(),
  unpublishVersion: vi.fn(),
}

export const useVersionOperations = vi.fn(() => useVersionOperationsReturn) as Mock<() => VersionOperationsValue> 