import {describe, expect, it, vi} from 'vitest'

import {createRequestActivityTracker} from '../../diagnostics/requestActivity'
import {type StudioTabActivity, type StudioTabsCensus} from '../../diagnostics/studioTabsCensus'
import {
  createRequestActivityReporter,
  LONG_WAIT_MS,
  MANY_IN_FLIGHT,
  type RequestActivityReporterOptions,
} from '../requestActivityReporter'

const QUERY_URL = 'https://project-id.api.sanity.io/v2025-02-19/data/query/production?tag=a'
const LISTEN_URL = 'https://project-id.api.sanity.io/v2025-02-19/data/listen/production?tag=b'

function census(totals: StudioTabsCensus['totals']): StudioTabsCensus {
  return {status: 'success', tabs: [], totals, waitedMs: 1000}
}

function setup(overrides: Partial<RequestActivityReporterOptions> = {}) {
  let time = 0
  const now = () => time
  const tracker = createRequestActivityTracker(now)
  const sendSummary = vi.fn()
  const sendLimitApproached = vi.fn()
  const requestCensus =
    overrides.requestCensus ??
    vi.fn((tab: StudioTabActivity) => Promise.resolve(census({...tab.requests, tabs: 1})))
  const reporter = createRequestActivityReporter({
    getVisibilityState: () => 'visible',
    now,
    sendLimitApproached,
    sendSummary,
    studioVersion: '6.22.0',
    tracker,
    ...overrides,
    requestCensus,
  })

  return {
    advance: (ms: number) => (time += ms),
    reporter,
    requestCensus,
    sendLimitApproached,
    sendSummary,
    tracker,
  }
}

describe('createRequestActivityReporter', () => {
  it('summarizes each window with the visibility state', () => {
    const {advance, reporter, sendSummary, tracker} = setup()

    tracker.start(LISTEN_URL, {stream: true}).responded()
    tracker.start(QUERY_URL, {stream: false}).responded()
    advance(300_000)
    reporter.summarize()

    expect(sendSummary).toHaveBeenCalledWith({
      longestWaitMs: 0,
      peakInFlight: 2,
      peakOpenStreams: 1,
      peakPendingRequests: 1,
      requestsStarted: 2,
      streamsStarted: 1,
      visibilityState: 'visible',
      windowMs: 300_000,
    })
  })

  it('stays quiet for an idle tab with nothing open', () => {
    const {advance, reporter, sendSummary} = setup()

    advance(300_000)
    reporter.summarize()

    expect(sendSummary).not.toHaveBeenCalled()
  })

  it('only flushes on page hide once the window has run for a while', () => {
    const {advance, reporter, sendSummary, tracker} = setup()
    tracker.start(QUERY_URL, {stream: false}).responded()

    advance(5_000)
    reporter.flush()
    expect(sendSummary).not.toHaveBeenCalled()

    advance(30_000)
    reporter.flush()
    expect(sendSummary).toHaveBeenCalledTimes(1)
  })

  it('reports a long wait together with what the other tabs hold', async () => {
    const {advance, reporter, requestCensus, sendLimitApproached, tracker} = setup({
      requestCensus: vi.fn(() =>
        Promise.resolve(
          census({oldestPendingMs: 41_000, openStreams: 97, pendingRequests: 7, tabs: 3}),
        ),
      ),
    })

    tracker.start(QUERY_URL, {stream: false})
    advance(LONG_WAIT_MS - 1)
    await reporter.checkLimit()
    expect(sendLimitApproached).not.toHaveBeenCalled()

    advance(1)
    await reporter.checkLimit()

    expect(requestCensus).toHaveBeenCalledTimes(1)
    expect(sendLimitApproached).toHaveBeenCalledWith({
      allTabs: {oldestPendingMs: 41_000, openStreams: 97, pendingRequests: 7, tabs: 3},
      tab: {oldestPendingMs: LONG_WAIT_MS, openStreams: 0, pendingRequests: 1},
      trigger: 'long-wait',
    })
  })

  it('reports a tab that holds most of the request budget by itself', async () => {
    const {reporter, sendLimitApproached, tracker} = setup()

    for (let i = 0; i < MANY_IN_FLIGHT; i++) tracker.start(LISTEN_URL, {stream: true}).responded()
    await reporter.checkLimit()

    expect(sendLimitApproached).toHaveBeenCalledWith(
      expect.objectContaining({
        tab: {oldestPendingMs: undefined, openStreams: MANY_IN_FLIGHT, pendingRequests: 0},
        trigger: 'many-in-flight',
      }),
    )
  })

  it('waits ten minutes before reporting again', async () => {
    const {advance, reporter, requestCensus, sendLimitApproached, tracker} = setup()
    tracker.start(QUERY_URL, {stream: false})
    advance(LONG_WAIT_MS)

    await reporter.checkLimit()
    advance(9 * 60_000)
    await reporter.checkLimit()
    expect(sendLimitApproached).toHaveBeenCalledTimes(1)
    expect(requestCensus).toHaveBeenCalledTimes(1)

    advance(60_000)
    await reporter.checkLimit()
    expect(sendLimitApproached).toHaveBeenCalledTimes(2)
  })

  it('leaves out the totals when other tabs cannot be asked', async () => {
    const {advance, reporter, sendLimitApproached, tracker} = setup({
      requestCensus: (tab) =>
        Promise.resolve({...census({...tab.requests, tabs: 1}), status: 'unsupported'}),
    })
    tracker.start(QUERY_URL, {stream: false})
    advance(LONG_WAIT_MS)

    await reporter.checkLimit()

    expect(sendLimitApproached).toHaveBeenCalledWith(
      expect.objectContaining({allTabs: undefined, trigger: 'long-wait'}),
    )
  })

  it('does not start a second census while one is still collecting answers', async () => {
    let finishCensus!: (value: StudioTabsCensus) => void
    const requestCensus = vi.fn(
      () => new Promise<StudioTabsCensus>((resolve) => (finishCensus = resolve)),
    )
    const {advance, reporter, sendLimitApproached, tracker} = setup({requestCensus})
    tracker.start(QUERY_URL, {stream: false})
    advance(LONG_WAIT_MS)

    const first = reporter.checkLimit()
    await reporter.checkLimit()
    finishCensus(census({openStreams: 0, pendingRequests: 1, tabs: 1}))
    await first

    expect(requestCensus).toHaveBeenCalledTimes(1)
    expect(sendLimitApproached).toHaveBeenCalledTimes(1)
  })
})
