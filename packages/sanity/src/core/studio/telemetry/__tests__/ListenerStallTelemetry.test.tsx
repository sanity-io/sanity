import {createClient} from '@sanity/client'
import {createBatchedStore, createSessionId} from '@sanity/telemetry'
import {render} from '@testing-library/react'
import {afterEach, beforeEach, expect, it, vi} from 'vitest'

function createFakeLocks(): {locks: LockManager; held: string[]} {
  const held: string[] = []
  const locks = {
    request: async (name: string, callback: () => Promise<void>) => {
      held.push(name)
      await callback()
      held.splice(held.indexOf(name), 1)
    },
    query: () => Promise.resolve({held: held.map((name) => ({name, mode: 'exclusive'}))}),
  }
  return {locks: locks as unknown as LockManager, held}
}

const protocolCheckClient = createClient({
  projectId: 'abc123',
  dataset: 'production',
  apiVersion: '2025-03-01',
  apiHost: 'https://api.sanity.io',
  useCdn: false,
})

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

it('logs every calibration field from its documented source when a boot stall is classified', async () => {
  vi.resetModules()
  const fakeLocks = createFakeLocks()
  vi.stubGlobal('navigator', {...navigator, locks: fakeLocks.locks})
  vi.stubGlobal(
    'fetch',
    vi.fn(() => new Promise(() => undefined)),
  )

  const {ListenerStallTelemetry} = await import('../ListenerStallTelemetry')
  const {resolveListenerCountingFetch} = await import('../../../network/listenerCount')
  const {startTrackingStudioTabs} = await import('../../../network/studioTabs')
  const {ListenerLimitMessageShown} = await import('../../__telemetry__/listeners.telemetry')

  const store = createBatchedStore(createSessionId(), {
    resolveConsent: () => Promise.resolve({status: 'granted'}),
    sendEvents: () => Promise.resolve(),
    sendBeacon: () => true,
  })
  const logSpy = vi.spyOn(store.logger, 'log')

  render(
    <ListenerStallTelemetry telemetry={store.logger} protocolCheckClient={protocolCheckClient} />,
  )

  startTrackingStudioTabs('api.sanity.io')
  await vi.runAllTimersAsync()

  const countingFetch = resolveListenerCountingFetch()
  void countingFetch('https://abc123.api.sanity.io/v1/users/me')
  await vi.advanceTimersByTimeAsync(10_000)
  await vi.waitFor(() => expect(logSpy).toHaveBeenCalled())

  expect(logSpy).toHaveBeenCalledWith(ListenerLimitMessageShown, {
    kind: 'not-listener-limit',
    listenersAllTabs: 0,
    listenersThisTab: 0,
    listenersOtherTabs: 0,
    knownStudioTabs: 1,
    unknownStudioTabs: 0,
    stalledListenersThisTab: 1,
    stalledOtherTabs: 0,
    isBootStall: true,
    stallOccurrence: 1,
    stalledForMs: expect.any(Number),
    protocol: 'unknown',
    budget: 80,
  })
})
