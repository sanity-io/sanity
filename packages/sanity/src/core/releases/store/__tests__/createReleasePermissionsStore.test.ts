import {describe, expect, it, vi} from 'vitest'

import {createReleasePermissionsStore} from '../createReleasePermissionsStore'

const permissionError = {details: {type: 'insufficientPermissionsError'}}
const nestedPermissionError = {
  details: {
    type: 'mutationError',
    items: [{index: 0, error: {type: 'insufficientPermissionsError'}}],
  },
}

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

    it.each([
      ['a top-level permission error', permissionError],
      ['a nested mutation error item permission error', nestedPermissionError],
    ])(
      'should return false every time for %s without re-running the action',
      async (_description, rejection) => {
        const mockAction = vi.fn().mockRejectedValue(rejection)
        const store = createReleasePermissionsStore(true)

        expect(await store.checkWithPermissionGuard(mockAction)).toBe(false)
        expect(await store.checkWithPermissionGuard(mockAction)).toBe(false)
        expect(mockAction).toHaveBeenCalledTimes(1)
        expect(store.permissions).toEqual({[mockAction.name]: false})
      },
    )

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

    it('should check each release separately', async () => {
      const mockAction = vi.fn((releaseId: string) =>
        releaseId === '_.releases.restricted' ? Promise.reject(permissionError) : Promise.resolve(),
      )
      const store = createReleasePermissionsStore(true)

      expect(await store.checkWithPermissionGuard(mockAction, '_.releases.open')).toBe(true)
      expect(await store.checkWithPermissionGuard(mockAction, '_.releases.restricted')).toBe(false)
      expect(await store.checkWithPermissionGuard(mockAction, '_.releases.open')).toBe(true)
      expect(mockAction).toHaveBeenCalledTimes(2)
    })

    it('should reuse a check for the same release regardless of non-string arguments', async () => {
      const mockAction = vi.fn((_releaseId: string, _date: Date) => Promise.resolve())
      const store = createReleasePermissionsStore(true)

      await store.checkWithPermissionGuard(mockAction, '_.releases.a', new Date(1))
      await store.checkWithPermissionGuard(mockAction, '_.releases.a', new Date(2))
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
