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
      sessionSummary: {
        buckets: [{bucket: 'query', count: 3, maxMs: 40, medianMs: 20, p95Ms: 40}],
        startedAt: expect.any(String),
        totalRequests: 3,
      },
      totalRequests: 3,
      truncated: true,
    })
    expect(tracker.getSnapshot({dataset: 'staging', projectId: 'project-a'})).toEqual({
      dataset: 'staging',
      entries: [createEntry({dataset: 'staging', durationMs: 30})],
      maxEntries: 3,
      projectId: 'project-a',
      sessionSummary: {
        buckets: [{bucket: 'query', count: 1, maxMs: 30, medianMs: 30, p95Ms: 30}],
        startedAt: expect.any(String),
        totalRequests: 1,
      },
      totalRequests: 1,
      truncated: false,
    })
    expect(tracker.getSnapshot({dataset: 'production', projectId: 'project-b'})).toEqual({
      dataset: 'production',
      entries: [],
      maxEntries: 3,
      projectId: 'project-b',
      sessionSummary: {buckets: [], startedAt: expect.any(String), totalRequests: 0},
      totalRequests: 0,
      truncated: false,
    })
  })

  it('keeps uncapped session summaries without retaining every request', () => {
    const tracker = createRequestPerformanceTracker(2)

    for (let durationMs = 1; durationMs <= 100; durationMs += 1) {
      tracker.record(createEntry({durationMs}))
    }
    tracker.record(createEntry({durationMs: 1_000, status: 'aborted'}))

    const snapshot = tracker.getSnapshot({dataset: 'production', projectId: 'project-a'})
    expect(snapshot.entries).toHaveLength(2)
    expect(snapshot.sessionSummary.totalRequests).toBe(101)
    expect(snapshot.sessionSummary.buckets).toEqual([
      {
        bucket: 'query',
        count: 100,
        maxMs: 100,
        medianMs: expect.closeTo(50, 0),
        p95Ms: expect.closeTo(95, 0),
      },
    ])
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
