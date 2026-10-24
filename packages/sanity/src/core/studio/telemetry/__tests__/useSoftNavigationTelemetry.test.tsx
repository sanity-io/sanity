import {createBatchedStore, createSessionId, type TelemetryEvent} from '@sanity/telemetry'
import {TelemetryProvider} from '@sanity/telemetry/react'
import {renderHook, waitFor} from '@testing-library/react'
import {type ReactNode} from 'react'
import {afterEach, beforeEach, expect, it, vi} from 'vitest'
import {type FCPMetric, onFCP, onLCP} from 'web-vitals'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {useSoftNavigationTelemetry} from '../useSoftNavigationTelemetry'

vi.mock('web-vitals', () => ({onCLS: vi.fn(), onFCP: vi.fn(), onINP: vi.fn(), onLCP: vi.fn()}))

import.meta.env.SANITY_STUDIO_DEBUG_TELEMETRY = 'true'

class SoftNavigationPerformanceObserver {
  static supportedEntryTypes = ['soft-navigation']
  observe() {}
  disconnect() {}
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

function hidePage() {
  Object.defineProperty(document, 'visibilityState', {value: 'hidden', configurable: true})
  document.dispatchEvent(new Event('visibilitychange'))
}

beforeEach(() => {
  vi.stubGlobal('PerformanceObserver', SoftNavigationPerformanceObserver)
})

afterEach(() => {
  vi.unstubAllGlobals()
  Object.defineProperty(document, 'visibilityState', {value: 'visible', configurable: true})
})

it('reports each soft nav once, to the newest store, when Studio remounts on a workspace switch', async () => {
  const TestProvider = await createTestProvider()
  const first = createCollectingStore()
  const second = createCollectingStore()

  function renderWithStore(store: ReturnType<typeof createCollectingStore>['store']) {
    return renderHook(() => useSoftNavigationTelemetry(), {
      wrapper: ({children}: {children: ReactNode}) => (
        <TestProvider>
          <TelemetryProvider store={store}>{children}</TelemetryProvider>
        </TestProvider>
      ),
    })
  }

  renderWithStore(first.store).unmount()
  renderWithStore(second.store)

  expect(onLCP).toHaveBeenCalledTimes(1)

  const [recordFCP] = vi.mocked(onFCP).mock.calls[0]
  const fcp: FCPMetric = {
    name: 'FCP',
    value: 120,
    rating: 'good',
    delta: 120,
    id: 'v6-fcp',
    entries: [],
    navigationType: 'soft-navigation',
    navigationId: 7,
    navigationURL: `${location.origin}/structure/book`,
  }
  recordFCP(fcp)
  hidePage()

  await waitFor(() => expect(second.sent).toHaveLength(1))
  expect(second.sent[0]).toMatchObject({
    name: 'Performance Soft Navigation Measured',
    data: {navigationId: 7, fcp: {value: 120, rating: 'good'}},
  })
  expect(first.sent).toEqual([])
})
