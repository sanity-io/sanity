import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

import {type PerformanceSoftNavigationMeasuredData} from '../../__telemetry__/performance.telemetry'
import {recordStructurePaneKind, recordStructureTool} from '../paneKindRegistry'
import {
  createSoftNavigationReporter,
  type SoftNavigationMetric,
  toLcpElementKind,
} from '../softNavigationReporter'

const SETTLE_MS = 3000
const MAX_EVENTS = 200

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
  recordStructureTool('structure')
  recordStructureTool('cars')
  recordStructurePaneKind('structure', 'root;book', 'list')
  recordStructurePaneKind('structure', 'root;book;book-a', 'document')
  recordStructurePaneKind('structure', 'root;book;book-b', 'document')
  recordStructurePaneKind('cars', 'root;car;car-a', 'document')
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

    vi.advanceTimersByTime(SETTLE_MS)

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
    vi.advanceTimersByTime(SETTLE_MS - 1)
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
    vi.advanceTimersByTime(SETTLE_MS - 1)
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

  it('settles a soft nav whose first metric arrives after a newer nav started', () => {
    const {events, reporter} = startReporter()

    reporter.record(metric('FCP', {navigationId: 2, navigationURL: OTHER_DOCUMENT_URL}))
    reporter.record(metric('CLS', {navigationId: 1, navigationURL: DOCUMENT_URL}))
    vi.advanceTimersByTime(SETTLE_MS)

    expect(events.map((event) => event.navigationId)).toEqual([1])
  })

  it('describes a soft nav with the workspace it started in', () => {
    const events: PerformanceSoftNavigationMeasuredData[] = []
    let workspace = {basePath: '/test', toolNames: ['structure']}
    const reporter = createSoftNavigationReporter({
      initialURL: LIST_URL,
      getWorkspace: () => workspace,
      send: (event) => events.push(event),
    })

    reporter.record(metric('FCP', {navigationId: 1, navigationURL: DOCUMENT_URL}))
    workspace = {basePath: '/us', toolNames: ['structure']}
    reporter.flush()

    expect(events[0]).toMatchObject({route: 'structure:document', change: 'document-open'})
  })

  it('classifies a structure tool renamed to cars like structure', () => {
    const events: PerformanceSoftNavigationMeasuredData[] = []
    const carURL = `${ORIGIN}/test/cars/car;car-a`
    const inspectURL = `${ORIGIN}/test/cars/car;${encodeURIComponent(
      `car-a,inspect=${encodeURIComponent('sanity/structure/validation')}`,
    )}`
    const reporter = createSoftNavigationReporter({
      initialURL: `${ORIGIN}/test/cars/car`,
      getWorkspace: () => ({basePath: '/test', toolNames: ['cars']}),
      send: (event) => events.push(event),
    })

    reporter.record(metric('FCP', {navigationId: 1, navigationURL: carURL}))
    reporter.record(metric('LCP', {navigationId: 1, navigationURL: carURL}))
    reporter.record(metric('FCP', {navigationId: 2, navigationURL: inspectURL}))
    reporter.record(metric('LCP', {navigationId: 2, navigationURL: inspectURL}))
    reporter.flush()

    expect(events).toEqual([
      expect.objectContaining({
        route: 'structure:document',
        change: 'document-open',
        lcp: expect.objectContaining({value: 100}),
        fcp: {value: 100, rating: 'good'},
      }),
      {
        navigationId: 2,
        navigationType: 'soft-navigation',
        route: 'structure:document',
        change: 'inspector-toggle',
        sampleRate: 0.1,
      },
    ])
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

  it(`stops after ${MAX_EVENTS} soft navs in a session`, () => {
    const {events, reporter} = startReporter()

    Array.from({length: MAX_EVENTS + 5}, (_unused, index) => index + 1).forEach((navigationId) => {
      reporter.record(metric('FCP', {navigationId, navigationURL: DOCUMENT_URL}))
      reporter.flush()
    })

    expect(events).toHaveLength(MAX_EVENTS)
  })
})

function mount(html: string, selector: string): Element | null {
  document.body.innerHTML = html
  return document.querySelector(selector)
}

describe('toLcpElementKind', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('reads the document title heading as title, although it sits inside the form', () => {
    const element = mount(
      '<div data-testid="form-view"><h2 data-testid="document-panel-document-title"><span id="text">Winnie</span></h2></div>',
      '#text',
    )

    expect(toLcpElementKind({element, url: ''})).toBe('title')
  })

  it('reads an editable title field as title', () => {
    const element = mount(
      '<div data-testid="form-view"><button data-testid="document-panel-document-title-field">Winnie</button></div>',
      'button',
    )

    expect(toLcpElementKind({element, url: ''})).toBe('title')
  })

  it('reads a painted image as image', () => {
    const element = mount(
      '<div data-testid="form-view"><img src="https://cdn.sanity.io/bear.avif" /></div>',
      'img',
    )

    expect(toLcpElementKind({element, url: 'https://cdn.sanity.io/bear.avif'})).toBe('image')
  })

  it('reads other form content as field', () => {
    const element = mount('<div data-testid="form-view"><p>Long text</p></div>', 'p')

    expect(toLcpElementKind({element, url: ''})).toBe('field')
  })

  it('reads anything outside the form as other', () => {
    const element = mount('<header><h1>Books</h1></header>', 'h1')

    expect(toLcpElementKind({element, url: ''})).toBe('other')
  })

  it('reads a detached element as other', () => {
    expect(toLcpElementKind({element: null, url: ''})).toBe('other')
  })
})
