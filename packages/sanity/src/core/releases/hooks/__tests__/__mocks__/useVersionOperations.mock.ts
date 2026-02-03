import {useVersionOperations, type VersionOperationsValue} from '../../useVersionOperations'
import {type Mock, type Mocked, vi} from 'vitest'

export const useVersionOperationsReturn: Mocked<VersionOperationsValue> = {
  createVersion: vi.fn(),
  discardVersion: vi.fn(),
  unpublishVersion: vi.fn(),
}

export const mockUseVersionOperations = useVersionOperations as Mock<typeof useVersionOperations>
