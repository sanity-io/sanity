import {createClient} from '@sanity/client'
import {createBatchedStore, createSessionId, type TelemetryEvent} from '@sanity/telemetry'
import {act, renderHook} from '@testing-library/react'
import {afterEach, beforeEach, expect, it, vi} from 'vitest'

const FIVE_MINUTES = 5 * 60_000

const protocolCheckClient = createClient({
  projectId: 'abc123',
  dataset: 'production',
  apiVersion: '2025-03-01',
  useCdn: false,
})

beforeEach(() => {
  vi.useFakeTimers()
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
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

it('reports the peak listener count every five minutes while it rises', async () => {
  vi.resetModules()
  const {useListenerPeakTelemetry} = await import('../useListenerPeakTelemetry')
  const {resolveListenerCountingFetch} = await import('../../../network/listenerCount')
  const countingFetch = resolveListenerCountingFetch()
  const sent: TelemetryEvent[] = []
  const store = createBatchedStore(createSessionId(), {
    resolveConsent: () => Promise.resolve({status: 'granted'}),
    sendEvents: (events) => {
      sent.push(...events)
      return Promise.resolve()
    },
  })
  const openListener = () =>
    countingFetch('https://abc123.api.sanity.io/v1/data/listen', {
      headers: {Accept: 'text/event-stream'},
    })
  const listenerPeaks = async () => {
    await store.flush()
    return sent
      .filter((event) => event.type === 'log' && event.name === 'Listener Peak Measured')
      .map((event) => (event.type === 'log' ? event.data : undefined))
  }

  renderHook(() => useListenerPeakTelemetry(store.logger, protocolCheckClient))
  await openListener()
  await act(() => vi.advanceTimersByTimeAsync(FIVE_MINUTES))
  await act(() => vi.advanceTimersByTimeAsync(FIVE_MINUTES))
  await openListener()
  await act(() => vi.advanceTimersByTimeAsync(FIVE_MINUTES))

  expect(await listenerPeaks()).toEqual([
    expect.objectContaining({peakListenerCount: 1, peakStudioTabCount: null}),
    expect.objectContaining({peakListenerCount: 2, peakStudioTabCount: null}),
  ])
})
