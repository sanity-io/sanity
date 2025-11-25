import {describe, expect, it, vi} from 'vitest'

import {createReleasePermissionsStore} from '../createReleasePermissionsStore'

describe('useReleasePermissions', () => {
  describe('when content release feature is enabled', () => {
    it('should return true when action succeeds', async () => {
      const mockAction = vi.fn().mockResolvedValueOnce(undefined)
      const result = await createReleasePermissionsStore(true).checkWithPermissionGuard(mockAction)

      expect(result).toBe(true)
      expect(mockAction).toHaveBeenCalledWith({
        dryRun: true,
        skipCrossDatasetReferenceValidation: true,
      })
    })
  })

  describe('when content release feature is disabled', () => {
    it('should allow permissions', async () => {
      const mockAction = vi.fn()
      const result = await createReleasePermissionsStore(false).checkWithPermissionGuard(mockAction)

      expect(result).toBe(true)
      expect(mockAction).not.toHaveBeenCalled()
    })
  })
})
