import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

import {type PerformanceSoftNavigationMeasuredData} from '../../__telemetry__/performance.telemetry'
import {recordStructurePaneKind} from '../paneKindRegistry'
import {
  createSoftNavigationReporter,
  MAX_SOFT_NAVIGATION_EVENTS,
  SOFT_NAVIGATION_SETTLE_MS,
  type SoftNavigationMetric,
} from '../softNavigationReporter'

const ORIGIN = 'https://test-studio.sanity.dev'
const LIST_URL = `${ORIGIN}/test/structure/book`
const DOCUMENT_URL = `${ORIGIN}/test/structure/book;book-a`
const OTHER_DOCUMENT_URL = `${ORIGIN}/test/structure/book;book-b`
const VIEW_URL = `${ORIGIN}/test/structure/book;${encodeURIComponent('book-a,view=preview')}`

interface MetricInput {
  navigationId: number
  navigationURL: string
  value?: number
  navigationType?: SoftNavigationMetric['navigationType']
  entries?: SoftNavigationMetric['entries']
}

function metric(name: SoftNavigationMetric['name'], input: MetricInput): SoftNavigationMetric {
  return {
    name,
    value: input.value ?? 100,
    rating: 'good',
    navigationType: input.navigationType ?? 'soft-navigation',
    navigationId: input.navigationId,
    navigationURL: input.navigationURL,
    entries: input.entries ?? [],
  }
}

function paintedEntry(element: Element | null, url = '') {
  return {
    element,
    url,
    name: '',
    entryType: 'largest-contentful-paint',
    startTime: 0,
    duration: 0,
    toJSON: () => ({}),
  }
}

function startReporter() {
  const events: PerformanceSoftNavigationMeasuredData[] = []
  const reporter = createSoftNavigationReporter({
    initialURL: LIST_URL,
    getWorkspace: () => ({basePath: '/test', toolNames: ['structure', 'vision']}),
    send: (event) => events.push(event),
  })
  return {events, reporter}
}

beforeAll(() => {
  recordStructurePaneKind('book', 'list')
  recordStructurePaneKind('book;book-a', 'document')
  recordStructurePaneKind('book;book-b', 'document')
})

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('createSoftNavigationReporter', () => {
  it('sends one event per soft nav with every metric, once the next nav has settled', () => {
    const {events, reporter} = startReporter()

    reporter.record(metric('FCP', {navigationId: 1, navigationURL: DOCUMENT_URL, value: 120}))
    reporter.record(metric('LCP', {navigationId: 1, navigationURL: DOCUMENT_URL, value: 340}))
    reporter.record(metric('FCP', {navigationId: 2, navigationURL: OTHER_DOCUMENT_URL}))
    reporter.record(metric('CLS', {navigationId: 1, navigationURL: DOCUMENT_URL, value: 0.01}))
    expect(events).toEqual([])

    vi.advanceTimersByTime(SOFT_NAVIGATION_SETTLE_MS)

    expect(events).toEqual([
      {
        navigationId: 1,
        navigationType: 'soft-navigation',
        route: 'structure:document',
        change: 'document-open',
        sampleRate: 0.1,
        fcp: {value: 120, rating: 'good'},
        lcp: {value: 340, rating: 'good', elementKind: 'other'},
        cls: {value: 0.01, rating: 'good'},
      },
    ])
  })

  it('waits out the settle window for INP, which web-vitals reports from an idle callback', () => {
    const {events, reporter} = startReporter()

    reporter.record(metric('FCP', {navigationId: 1, navigationURL: DOCUMENT_URL}))
    reporter.record(metric('FCP', {navigationId: 2, navigationURL: OTHER_DOCUMENT_URL}))
    vi.advanceTimersByTime(SOFT_NAVIGATION_SETTLE_MS - 1)
    reporter.record(metric('INP', {navigationId: 1, navigationURL: DOCUMENT_URL, value: 64}))
    vi.advanceTimersByTime(1)

    expect(events).toHaveLength(1)
    expect(events[0].inp).toEqual({value: 64, rating: 'good'})
  })

  it('sends every pending soft nav when flushed, as on page hide', () => {
    const {events, reporter} = startReporter()

    reporter.record(metric('FCP', {navigationId: 1, navigationURL: DOCUMENT_URL}))
    reporter.record(metric('FCP', {navigationId: 2, navigationURL: OTHER_DOCUMENT_URL}))
    reporter.flush()

    expect(events.map((event) => event.navigationId)).toEqual([1, 2])
  })

  it('leaves later soft navs alone when a settle timer from before a page hide fires', () => {
    const {events, reporter} = startReporter()

    reporter.record(metric('FCP', {navigationId: 1, navigationURL: DOCUMENT_URL}))
    reporter.record(metric('FCP', {navigationId: 2, navigationURL: OTHER_DOCUMENT_URL}))
    reporter.flush()
    vi.advanceTimersByTime(SOFT_NAVIGATION_SETTLE_MS - 1)
    reporter.record(metric('FCP', {navigationId: 3, navigationURL: DOCUMENT_URL}))
    reporter.record(metric('FCP', {navigationId: 4, navigationURL: OTHER_DOCUMENT_URL}))
    vi.advanceTimersByTime(1)

    expect(events.map((event) => event.navigationId)).toEqual([1, 2])
  })

  it('diffs against the URL the browser left, even when the nav before it emitted no soft nav', () => {
    const events: PerformanceSoftNavigationMeasuredData[] = []
    const releasesURL = `${ORIGIN}/test/releases`
    const reporter = createSoftNavigationReporter({
      initialURL: LIST_URL,
      getWorkspace: () => ({basePath: '/test', toolNames: ['structure', 'releases']}),
      getPreviousURL: (navigationURL) => (navigationURL === VIEW_URL ? DOCUMENT_URL : undefined),
      send: (event) => events.push(event),
    })

    reporter.record(metric('FCP', {navigationId: 1, navigationURL: releasesURL}))
    reporter.record(metric('FCP', {navigationId: 2, navigationURL: VIEW_URL}))
    reporter.flush()

    expect(events.map((event) => event.change)).toEqual(['tool-switch', 'view-change'])
  })

  it('drops metrics that arrive for a soft nav already sent', () => {
    const {events, reporter} = startReporter()

    reporter.record(metric('FCP', {navigationId: 1, navigationURL: DOCUMENT_URL}))
    reporter.flush()
    reporter.record(metric('CLS', {navigationId: 1, navigationURL: DOCUMENT_URL}))
    reporter.flush()

    expect(events).toHaveLength(1)
    expect(events[0].cls).toBeUndefined()
  })

  it('ignores hard-navigation metrics', () => {
    const {events, reporter} = startReporter()

    reporter.record(
      metric('LCP', {navigationId: 1, navigationURL: LIST_URL, navigationType: 'navigate'}),
    )
    reporter.flush()

    expect(events).toEqual([])
  })

  it('leaves out LCP and FCP when the soft nav only changed a document view', () => {
    const {events, reporter} = startReporter()

    reporter.record(metric('FCP', {navigationId: 1, navigationURL: DOCUMENT_URL}))
    reporter.record(metric('FCP', {navigationId: 2, navigationURL: VIEW_URL}))
    reporter.record(metric('LCP', {navigationId: 2, navigationURL: VIEW_URL}))
    reporter.record(metric('INP', {navigationId: 2, navigationURL: VIEW_URL, value: 48}))
    reporter.record(metric('CLS', {navigationId: 2, navigationURL: VIEW_URL, value: 0}))
    reporter.flush()

    expect(events[1]).toEqual({
      navigationId: 2,
      navigationType: 'soft-navigation',
      route: 'structure:document',
      change: 'view-change',
      sampleRate: 0.1,
      inp: {value: 48, rating: 'good'},
      cls: {value: 0, rating: 'good'},
    })
  })

  it('tells title-led document opens apart by the LCP element', () => {
    const {events, reporter} = startReporter()
    document.body.innerHTML = '<h2 data-testid="document-panel-document-title">Winnie</h2>'
    const title = document.querySelector('h2')

    reporter.record(
      metric('LCP', {navigationId: 1, navigationURL: DOCUMENT_URL, entries: [paintedEntry(title)]}),
    )
    document.body.innerHTML = ''
    reporter.flush()

    expect(events[0].lcp).toEqual({value: 100, rating: 'good', elementKind: 'title'})
  })

  it('never sends the navigation URL, which holds document and release IDs', () => {
    const {events, reporter} = startReporter()

    reporter.record(metric('FCP', {navigationId: 1, navigationURL: DOCUMENT_URL}))
    reporter.flush()

    expect(JSON.stringify(events)).not.toContain('book-a')
  })

  it(`stops after ${MAX_SOFT_NAVIGATION_EVENTS} soft navs in a session`, () => {
    const {events, reporter} = startReporter()

    Array.from({length: MAX_SOFT_NAVIGATION_EVENTS + 5}, (_, index) => index + 1).forEach(
      (navigationId) => {
        reporter.record(metric('FCP', {navigationId, navigationURL: DOCUMENT_URL}))
        reporter.flush()
      },
    )

    expect(events).toHaveLength(MAX_SOFT_NAVIGATION_EVENTS)
  })
})
