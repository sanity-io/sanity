import {createBatchedStore, createSessionId, type TelemetryEvent} from '@sanity/telemetry'
import {renderHook, waitFor} from '@testing-library/react'
import {type ReactNode} from 'react'
import {afterEach, beforeEach, expect, it, vi} from 'vitest'
import {type FCPMetricWithAttribution} from 'web-vitals/attribution'

vi.mock('web-vitals/attribution', () => ({
  onCLS: vi.fn(),
  onFCP: vi.fn(),
  onINP: vi.fn(),
  onLCP: vi.fn(),
}))

class SoftNavigationPerformanceObserver {
  static supportedEntryTypes = ['soft-navigation']
  observe() {}
  disconnect() {}
}

// The hook rolls sampling and registers web-vitals once per module load, so each test loads it fresh.
async function loadHook({debugTelemetry, roll}: {debugTelemetry: boolean; roll: number}) {
  vi.resetModules()
  import.meta.env.SANITY_STUDIO_DEBUG_TELEMETRY = debugTelemetry ? 'true' : ''
  vi.spyOn(Math, 'random').mockReturnValue(roll)
  const webVitals = await import('web-vitals/attribution')
  const {useSoftNavigationTelemetry} = await import('../useSoftNavigationTelemetry')
  const {TelemetryProvider} = await import('@sanity/telemetry/react')
  const {createTestProvider} = await import('../../../../../test/testUtils/TestProvider')
  const TestProvider = await createTestProvider()

  function renderWithStore(store: ReturnType<typeof createCollectingStore>['store']) {
    return renderHook(() => useSoftNavigationTelemetry(), {
      wrapper: ({children}: {children: ReactNode}) => (
        <TestProvider>
          <TelemetryProvider store={store}>{children}</TelemetryProvider>
        </TestProvider>
      ),
    })
  }

  return {webVitals, renderWithStore}
}

function createCollectingStore() {
  const sent: TelemetryEvent[] = []
  const store = createBatchedStore(createSessionId(), {
    resolveConsent: () => Promise.resolve({status: 'granted'}),
    sendEvents: (events) => {
      sent.push(...events)
      return Promise.resolve()
    },
  })
  return {sent, store}
}

function fcp(navigationId: number, navigationURL: string): FCPMetricWithAttribution {
  return {
    name: 'FCP',
    value: 120,
    rating: 'good',
    delta: 120,
    id: `v6-fcp-${navigationId}`,
    entries: [],
    navigationType: 'soft-navigation',
    navigationId,
    navigationURL,
    attribution: {timeToFirstByte: 0, firstByteToFCP: 120, loadState: 'complete'},
  }
}

beforeEach(() => {
  vi.stubGlobal('PerformanceObserver', SoftNavigationPerformanceObserver)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  Object.defineProperty(document, 'visibilityState', {value: 'visible', configurable: true})
})

it('reports each soft nav once, to the newest store, when Studio remounts on a workspace switch', async () => {
  const {webVitals, renderWithStore} = await loadHook({debugTelemetry: true, roll: 0.99})
  const first = createCollectingStore()
  const second = createCollectingStore()

  renderWithStore(first.store).unmount()
  renderWithStore(second.store)

  expect(webVitals.onLCP).toHaveBeenCalledTimes(1)

  const [recordFCP] = vi.mocked(webVitals.onFCP).mock.calls[0]
  recordFCP(fcp(7, `${location.origin}/structure/book`))
  Object.defineProperty(document, 'visibilityState', {value: 'hidden', configurable: true})
  document.dispatchEvent(new Event('visibilitychange'))

  await waitFor(() => expect(second.sent).toHaveLength(1))
  expect(second.sent[0]).toMatchObject({
    name: 'Performance Soft Navigation Measured',
    data: {navigationId: 7, fcp: {value: 120, rating: 'good'}},
  })
  expect(first.sent).toEqual([])
})

it('reports nothing for a page load that rolled outside the sample', async () => {
  const {webVitals, renderWithStore} = await loadHook({debugTelemetry: false, roll: 0.5})

  renderWithStore(createCollectingStore().store)

  expect(webVitals.onLCP).not.toHaveBeenCalled()
  expect(webVitals.onFCP).not.toHaveBeenCalled()
})

it('keeps the URL the browser left when a tool replaces its URL with itself on mount', async () => {
  const structureURL = `${location.origin}/structure/book`
  const releasesURL = `${location.origin}/releases`
  const navigationTarget = Object.assign(new EventTarget(), {currentEntry: {url: structureURL}})
  vi.stubGlobal('navigation', navigationTarget)
  function moveTo(url: string) {
    const from = {url: navigationTarget.currentEntry.url}
    navigationTarget.currentEntry = {url}
    navigationTarget.dispatchEvent(Object.assign(new Event('currententrychange'), {from}))
  }
  const {webVitals, renderWithStore} = await loadHook({debugTelemetry: true, roll: 0.99})
  const {sent, store} = createCollectingStore()
  renderWithStore(store)

  moveTo(releasesURL)
  moveTo(releasesURL)
  moveTo(releasesURL)
  const [recordFCP] = vi.mocked(webVitals.onFCP).mock.calls[0]
  recordFCP(fcp(9, releasesURL))
  Object.defineProperty(document, 'visibilityState', {value: 'hidden', configurable: true})
  document.dispatchEvent(new Event('visibilitychange'))

  await waitFor(() => expect(sent).toHaveLength(1))
  expect(sent[0]).toMatchObject({data: {navigationId: 9, change: 'tool-switch'}})
})
