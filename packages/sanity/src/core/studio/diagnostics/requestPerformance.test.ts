import {describe, expect, it} from 'vitest'

import {
  createRequestPerformanceTracker,
  getRequestBucket,
  type RequestPerformanceEntry,
} from './requestPerformance'

describe('getRequestBucket', () => {
  it.each([
    ['https://abc.api.sanity.io/v1/data/query/production?query=*', 'v1', 'query'],
    ['https://abc.api.sanity.io/vX/data/doc/production/id', 'vX', 'doc'],
    [
      'https://abc.api.sanity.io/v2025-02-19/data/history/production/documents/id',
      'v2025-02-19',
      'history',
    ],
  ])('classifies %s', (url, apiVersion, bucket) => {
    expect(getRequestBucket(url)).toEqual({apiVersion, bucket})
  })

  it('ignores requests outside data endpoints', () => {
    expect(getRequestBucket('https://abc.api.sanity.io/v1/users/me')).toBeUndefined()
  })
})

describe('createRequestPerformanceTracker', () => {
  it('keeps a bounded, ordered snapshot isolated to the requested target', () => {
    const tracker = createRequestPerformanceTracker(3)

    tracker.record(createEntry({durationMs: 10}))
    tracker.record(createEntry({durationMs: 20}))
    tracker.record(createEntry({dataset: 'staging', durationMs: 30}))
    tracker.record(createEntry({durationMs: 40}))

    expect(tracker.getSnapshot({dataset: 'production', projectId: 'project-a'})).toEqual({
      dataset: 'production',
      entries: [createEntry({durationMs: 20}), createEntry({durationMs: 40})],
      maxEntries: 3,
      projectId: 'project-a',
      totalRequests: 3,
      truncated: true,
    })
    expect(tracker.getSnapshot({dataset: 'staging', projectId: 'project-a'})).toEqual({
      dataset: 'staging',
      entries: [createEntry({dataset: 'staging', durationMs: 30})],
      maxEntries: 3,
      projectId: 'project-a',
      totalRequests: 1,
      truncated: false,
    })
    expect(tracker.getSnapshot({dataset: 'production', projectId: 'project-b'})).toEqual({
      dataset: 'production',
      entries: [],
      maxEntries: 3,
      projectId: 'project-b',
      totalRequests: 0,
      truncated: false,
    })
  })
})

function createEntry(overrides: Partial<RequestPerformanceEntry> = {}): RequestPerformanceEntry {
  return {
    apiVersion: 'v2025-02-19',
    bucket: 'query',
    dataset: 'production',
    durationMs: 10,
    projectId: 'project-a',
    startedAt: '2026-08-21T12:00:00.000Z',
    status: 'success',
    ...overrides,
  }
}
