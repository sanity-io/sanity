import {type Mock, type Mocked, vi} from 'vitest'

export const useReleasePermissionsMockReturn: Mocked<{
  checkWithPermissionGuard: () => Promise<boolean>
  permissions: Record<string, unknown>
}> = {
  checkWithPermissionGuard: vi.fn().mockResolvedValue(true),
  permissions: {},
}

export const useReleasesPermissionsMockReturnTrue: Mocked<{
  checkWithPermissionGuard: () => Promise<boolean>
  permissions: Record<string, unknown>
}> = {
  checkWithPermissionGuard: vi.fn().mockResolvedValue(true),
  permissions: {},
}

export const useReleasesPermissionsMockReturnFalse: Mocked<{
  checkWithPermissionGuard: () => Promise<boolean>
  permissions: Record<string, unknown>
}> = {
  checkWithPermissionGuard: vi.fn().mockResolvedValue(false),
  permissions: {},
}

export const useReleasePermissions = vi.fn(() => useReleasePermissionsMockReturn) as Mock<() => typeof useReleasePermissionsMockReturn> 