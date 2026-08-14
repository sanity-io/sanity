import {type Mock, type Mocked, vi} from 'vitest'

import {useVersionOperations, type VersionOperationsValue} from '../../useVersionOperations'

// @ts-expect-error -- pre-existing, fix later
export const useVersionOperationsReturn: Mocked<VersionOperationsValue> = {
  createVersion: vi.fn(),
  discardVersion: vi.fn(),
  // oxlint-disable-next-line no-deprecated
  unpublishVersion: vi.fn(),
}

export const mockUseVersionOperations = useVersionOperations as Mock<typeof useVersionOperations>
