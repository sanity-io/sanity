import {type Mock, type Mocked, vi} from 'vitest'

import {useVersionOperations, type VersionOperationsValue} from '../../useVersionOperations'

export const useVersionOperationsReturn: Mocked<VersionOperationsValue> = {
  createVersion: vi.fn(),
  revertUnpublishVersion: vi.fn(),
}

export const mockUseVersionOperations = useVersionOperations as Mock<typeof useVersionOperations>
