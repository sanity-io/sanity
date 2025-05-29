import {type Mock, vi} from 'vitest'

export const useDocumentPairPermissionsMockReturn = [
  {granted: true, reason: ''},
  false,
] as const

export const useDocumentPairPermissions = vi.fn(() => useDocumentPairPermissionsMockReturn) as Mock<() => typeof useDocumentPairPermissionsMockReturn> 