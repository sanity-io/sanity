import {type Mock, type Mocked, vi} from 'vitest'

import {useReleasePermissions} from '../../useReleasePermissions'

export const useReleasePermissionsMockReturn: Mocked<ReturnType<typeof useReleasePermissions>> = {
  checkWithPermissionGuard: vi.fn(),
  permissions: {},
}

export const useReleasesPermissionsMockReturnTrue: Mocked<
  ReturnType<typeof useReleasePermissions>
> = {
  checkWithPermissionGuard: vi.fn().mockResolvedValue(true),
  permissions: {},
}

export const useReleasesPermissionsMockReturnFalse: Mocked<
  ReturnType<typeof useReleasePermissions>
> = {
  checkWithPermissionGuard: vi.fn().mockResolvedValue(false),
  permissions: {},
}

export const mockUseReleasePermissions = useReleasePermissions as Mock<typeof useReleasePermissions>
