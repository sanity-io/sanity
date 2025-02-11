import {type Mock, type Mocked, vi} from 'vitest'

import {useReleasePermissions} from '../../useReleasePermissions'

export const useReleasePermissionsMockReturn: Mocked<ReturnType<typeof useReleasePermissions>> = {
  canPublish: vi.fn(),
  canSchedule: vi.fn(),
}

export const mockUseReleasePermissions = useReleasePermissions as Mock<typeof useReleasePermissions>
