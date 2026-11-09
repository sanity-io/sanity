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

// The hook reports once per module load, so each test loads it fresh.
async function loadHook() {
  vi.resetModules()
  const {useListenerPeakTelemetry} = await import('../useListenerPeakTelemetry')
  const {resolveListenerCountingFetch} = await import('../../../network/listenerCount')
  const {TelemetryProvider} = await import('@sanity/telemetry/react')

  // Mirrors StudioTelemetryProvider, which calls the hook above the TelemetryProvider it renders.
  function TelemetryProviderWithListenerPeak(props: {store: BeaconStore}) {
    useListenerPeakTelemetry(props.store.logger, protocolCheckClient)
    return <TelemetryProvider store={props.store}>{null}</TelemetryProvider>
  }

  function renderWithStore(store: BeaconStore) {
    return render(<TelemetryProviderWithListenerPeak store={store} />)
  }

  return {renderWithStore, countingFetch: resolveListenerCountingFetch()}
}

type BeaconStore = ReturnType<typeof createBeaconStore>['store']

function createBeaconStore() {
  const beacons: TelemetryEvent[][] = []
  const store = createBatchedStore(createSessionId(), {
    resolveConsent: () => Promise.resolve({status: 'granted'}),
    sendEvents: () => Promise.resolve(),
    sendBeacon: (events) => {
      beacons.push(events)
      return true
    },
  })
  return {beacons, store}
}

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

it('sends the peak listener count in the beacon when the page is hidden for good', async () => {
  const {renderWithStore, countingFetch} = await loadHook()
  const {beacons, store} = createBeaconStore()
  renderWithStore(store)

  const abortController = new AbortController()
  await countingFetch('https://abc123.api.sanity.io/v1/data/listen', {
    headers: {Accept: 'text/event-stream'},
    signal: abortController.signal,
  })
  abortController.abort()
  dispatchEvent(new PageTransitionEvent('pagehide'))
  dispatchEvent(new PageTransitionEvent('pagehide'))

  const listenerEvents = beacons
    .flat()
    .filter((event) => event.type === 'log' && event.name === 'Listener Peak Measured')
  expect(listenerEvents).toEqual([
    expect.objectContaining({
      data: {
        peakListenerCount: 1,
        peakStudioTabCount: null,
        protocol: 'unknown',
        sessionDurationMs: expect.any(Number),
      },
    }),
  ])
})

// The CLI's schema manifest worker copies only a jsdom window's own properties onto the global object.
it('registers on window where the global object has no addEventListener', async () => {
  const workerWindow = {addEventListener: vi.fn()}
  vi.stubGlobal('window', workerWindow)
  vi.stubGlobal('addEventListener', undefined)

  vi.resetModules()
  await import('../useListenerPeakTelemetry')

  expect(workerWindow.addEventListener).toHaveBeenCalledWith('pagehide', expect.any(Function), {
    capture: true,
  })
})
