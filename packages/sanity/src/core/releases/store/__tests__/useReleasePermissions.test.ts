import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createReleasePermissionsStore} from '../createReleasePermissionsStore'

describe('useReleasePermissions', () => {
  let mockClient: any

  beforeEach(() => {
    mockClient = {
      config: vi.fn().mockReturnValue({dataset: 'test-dataset'}),
      request: vi.fn().mockResolvedValue(undefined),
      create: vi.fn().mockResolvedValue(undefined),
      getDocument: vi.fn(),
    }
  })

  const createStore = () =>
    createReleasePermissionsStore({
      client: mockClient,
      onReleaseLimitReached: vi.fn(),
    })

  it('should check if it has permission to publish a release', async () => {
    const store = createStore()
    await store.canPublish('_.releases.release-id', true)
    expect(mockClient.request).toHaveBeenCalledWith({
      uri: '/data/actions/test-dataset',
      method: 'POST',
      body: {
        dryRun: true,
        skipCrossDatasetReferenceValidation: true,
        actions: [
          {
            actionType: 'sanity.action.release.publish2',
            releaseId: 'release-id',
          },
        ],
      },
    })
  })

  it('should check if it has permission to schedule a release', async () => {
    const store = createStore()
    await store.canSchedule('_.releases.release-id', new Date('2024-01-01T00:00:00Z'))
    expect(mockClient.request).toHaveBeenCalledWith({
      uri: '/data/actions/test-dataset',
      method: 'POST',
      body: {
        dryRun: true,
        skipCrossDatasetReferenceValidation: true,
        actions: [
          {
            actionType: 'sanity.action.release.schedule',
            releaseId: 'release-id',
            publishAt: '2024-01-01T00:00:00.000Z',
          },
        ],
      },
    })
  })
})
