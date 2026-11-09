import {createClient} from '@sanity/client'
import {createBatchedStore, createSessionId, type TelemetryEvent} from '@sanity/telemetry'
import {render} from '@testing-library/react'
import {afterEach, beforeEach, expect, it, vi} from 'vitest'

const protocolCheckClient = createClient({
  projectId: 'abc123',
  dataset: 'production',
  apiVersion: '2025-03-01',
  useCdn: false,
})

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(
        new Response(new ReadableStream(), {headers: {'content-type': 'text/event-stream'}}),
      ),
    ),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

it('sends the peak listener count in the closing beacon', async () => {
  vi.resetModules()
  const {ListenerPeakTelemetry} = await import('../ListenerPeakTelemetry')
  const {resolveListenerCountingFetch} = await import('../../../network/listenerCount')
  const {TelemetryProvider} = await import('@sanity/telemetry/react')
  const beacons: TelemetryEvent[][] = []
  const store = createBatchedStore(createSessionId(), {
    resolveConsent: () => Promise.resolve({status: 'granted'}),
    sendEvents: () => Promise.resolve(),
    sendBeacon: (events) => {
      beacons.push(events)
      return true
    },
  })

  render(
    <TelemetryProvider store={store}>
      <ListenerPeakTelemetry telemetry={store.logger} protocolCheckClient={protocolCheckClient} />
    </TelemetryProvider>,
  )
  await resolveListenerCountingFetch()('https://abc123.api.sanity.io/v1/data/listen', {
    headers: {Accept: 'text/event-stream'},
  })
  dispatchEvent(new PageTransitionEvent('pagehide'))

  const listenerPeaks = beacons
    .flat()
    .flatMap((event) =>
      event.type === 'log' && event.name === 'Listener Peak Measured' ? [event.data] : [],
    )
  expect(listenerPeaks).toEqual([
    {
      peakListenerCount: 1,
      peakStudioTabCount: null,
      protocol: expect.any(String),
      sessionDurationMs: expect.any(Number),
    },
  ])
})
