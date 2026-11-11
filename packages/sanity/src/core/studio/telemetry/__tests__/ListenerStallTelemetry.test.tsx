import {createBatchedStore, createSessionId} from '@sanity/telemetry'
import {DeferredTelemetryProvider, TelemetryProvider} from '@sanity/telemetry/react'
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

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

async function setUpStall() {
  vi.resetModules()
  const fakeLocks = createFakeLocks()
  vi.stubGlobal('navigator', {...navigator, locks: fakeLocks.locks})
  vi.stubGlobal(
    'fetch',
    vi.fn(() => new Promise(() => undefined)),
  )

  const {ListenerStallTelemetry, ListenerStallWorkspaceTelemetry} =
    await import('../ListenerStallTelemetry')
  const {resolveListenerCountingFetch} = await import('../../../network/listenerCount')
  const {startTrackingStudioTabs} = await import('../../../network/studioTabs')
  const {ListenerLimitMessageShown} = await import('../../__telemetry__/listeners.telemetry')

  const store = createBatchedStore(createSessionId(), {
    resolveConsent: () => Promise.resolve({status: 'granted'}),
    sendEvents: () => Promise.resolve(),
    sendBeacon: () => true,
  })

  return {
    ListenerStallTelemetry,
    ListenerStallWorkspaceTelemetry,
    ListenerLimitMessageShown,
    countingFetch: resolveListenerCountingFetch(),
    startTrackingStudioTabs,
    store,
  }
}

const expectedBootStallEvent = {
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
}

it('buffers a boot stall detected before any workspace store mounts, and sends it once one does', async () => {
  const {
    ListenerStallTelemetry,
    ListenerStallWorkspaceTelemetry,
    ListenerLimitMessageShown,
    countingFetch,
    startTrackingStudioTabs,
    store,
  } = await setUpStall()
  const resumeSpy = vi.spyOn(store.logger, 'resume')

  const {rerender} = render(
    <DeferredTelemetryProvider>
      <ListenerStallTelemetry />
    </DeferredTelemetryProvider>,
  )

  startTrackingStudioTabs('api.sanity.io')
  await vi.runAllTimersAsync()

  void countingFetch('https://abc123.api.sanity.io/v1/users/me')
  await vi.advanceTimersByTimeAsync(10_000)
  expect(resumeSpy).not.toHaveBeenCalled()

  rerender(
    <DeferredTelemetryProvider>
      <ListenerStallTelemetry />
      <TelemetryProvider store={store}>
        <ListenerStallWorkspaceTelemetry telemetry={store.logger} />
      </TelemetryProvider>
    </DeferredTelemetryProvider>,
  )

  await vi.waitFor(() =>
    expect(resumeSpy).toHaveBeenCalledWith([
      expect.objectContaining({event: ListenerLimitMessageShown, data: expectedBootStallEvent}),
    ]),
  )
})

it('replays a stall detected before the component ever mounts, logged exactly once', async () => {
  const {
    ListenerStallTelemetry,
    ListenerStallWorkspaceTelemetry,
    ListenerLimitMessageShown,
    countingFetch,
    startTrackingStudioTabs,
    store,
  } = await setUpStall()
  const logSpy = vi.spyOn(store.logger, 'log')

  startTrackingStudioTabs('api.sanity.io')
  await vi.runAllTimersAsync()

  void countingFetch('https://abc123.api.sanity.io/v1/users/me')
  await vi.advanceTimersByTimeAsync(10_000)

  render(
    <DeferredTelemetryProvider>
      <ListenerStallTelemetry />
      <TelemetryProvider store={store}>
        <ListenerStallWorkspaceTelemetry telemetry={store.logger} />
      </TelemetryProvider>
    </DeferredTelemetryProvider>,
  )

  await vi.waitFor(() =>
    expect(logSpy).toHaveBeenCalledWith(ListenerLimitMessageShown, expectedBootStallEvent),
  )
  expect(logSpy).toHaveBeenCalledTimes(1)
})

it('logs straight to the workspace store once it has mounted', async () => {
  const {
    ListenerStallTelemetry,
    ListenerStallWorkspaceTelemetry,
    ListenerLimitMessageShown,
    countingFetch,
    startTrackingStudioTabs,
    store,
  } = await setUpStall()
  const logSpy = vi.spyOn(store.logger, 'log')

  render(
    <DeferredTelemetryProvider>
      <ListenerStallTelemetry />
      <TelemetryProvider store={store}>
        <ListenerStallWorkspaceTelemetry telemetry={store.logger} />
      </TelemetryProvider>
    </DeferredTelemetryProvider>,
  )

  startTrackingStudioTabs('api.sanity.io')
  await vi.runAllTimersAsync()

  void countingFetch('https://abc123.api.sanity.io/v1/users/me')
  await vi.advanceTimersByTimeAsync(10_000)

  await vi.waitFor(() =>
    expect(logSpy).toHaveBeenCalledWith(ListenerLimitMessageShown, expectedBootStallEvent),
  )
})
