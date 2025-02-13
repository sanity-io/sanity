import {beforeEach, describe, expect, it, vi} from 'vitest'

import {useReleasePermissions} from '../useReleasePermissions'

describe('useReleasePermissions', () => {
  let store: ReturnType<typeof useReleasePermissions>

  beforeEach(() => {
    store = useReleasePermissions()
  })

  it('should return true when action succeeds', async () => {
    const mockAction = vi.fn().mockResolvedValueOnce(undefined)
    const result = await store.checkWithPermissionGuard(mockAction)

    expect(result).toBe(true)
    expect(mockAction).toHaveBeenCalledWith({
      dryRun: true,
      skipCrossDatasetReferenceValidation: true,
    })
  })
})
