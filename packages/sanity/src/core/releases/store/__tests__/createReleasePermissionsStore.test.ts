import {describe, expect, it, vi} from 'vitest'

import {createReleasePermissionsStore} from '../createReleasePermissionsStore'

const permissionError = {details: {type: 'insufficientPermissionsError'}}

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

    it('should return true every time for a non-permission error without re-running the action', async () => {
      const mockAction = vi.fn().mockRejectedValue(new Error('release limit exceeded'))
      const store = createReleasePermissionsStore(true)

      expect(await store.checkWithPermissionGuard(mockAction)).toBe(true)
      expect(await store.checkWithPermissionGuard(mockAction)).toBe(true)
      expect(mockAction).toHaveBeenCalledTimes(1)
      expect(store.permissions).toEqual({[mockAction.name]: true})
    })

    it('should return false every time for a permission error without re-running the action', async () => {
      const mockAction = vi.fn().mockRejectedValue(permissionError)
      const store = createReleasePermissionsStore(true)

      expect(await store.checkWithPermissionGuard(mockAction)).toBe(false)
      expect(await store.checkWithPermissionGuard(mockAction)).toBe(false)
      expect(mockAction).toHaveBeenCalledTimes(1)
      expect(store.permissions).toEqual({[mockAction.name]: false})
    })

    it('should share one dry run between concurrent calls', async () => {
      const mockAction = vi.fn().mockResolvedValue(undefined)
      const store = createReleasePermissionsStore(true)

      const results = await Promise.all([
        store.checkWithPermissionGuard(mockAction),
        store.checkWithPermissionGuard(mockAction),
      ])

      expect(results).toEqual([true, true])
      expect(mockAction).toHaveBeenCalledTimes(1)
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
