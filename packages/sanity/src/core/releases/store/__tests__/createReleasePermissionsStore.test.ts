import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createReleasePermissionsStore} from '../createReleasePermissionsStore'
import {type useReleasePermissionsValue} from '../useReleasePermissions'

const createStore = () => createReleasePermissionsStore()

describe('useReleasePermissions', () => {
  let store: useReleasePermissionsValue

  beforeEach(() => {
    store = createStore()
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
