import {describe, expect, it, vi} from 'vitest'

import {createAppIdCache} from '../appIdCache'

describe('appIdCache', () => {
  it(`invokes fetch function and caches the result`, async () => {
    const cache = createAppIdCache()
    const appIdFetcher = vi.fn((projectId) =>
      Promise.resolve({appId: `${projectId}-appId`, studioApps: []}),
    )
    const result1 = await cache.get({projectId: 'projectId', appIdFetcher})
    const result2 = await cache.get({projectId: 'projectId', appIdFetcher})

    expect(result1).toEqual({appId: 'projectId-appId', studioApps: []})
    expect(result1).toEqual(result2)
    expect(appIdFetcher).toHaveBeenCalledOnce()
  })

  it(`should suppress error and return undefined`, async () => {
    const cache = createAppIdCache()
    const appIdFetcher = vi.fn(async () => {
      throw new Error('simulated-error')
    })
    const result1 = await cache.get({projectId: 'projectId', appIdFetcher})
    expect(result1).toEqual(undefined)
  })
})
