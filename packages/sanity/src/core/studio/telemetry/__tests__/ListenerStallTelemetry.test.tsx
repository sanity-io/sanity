import {createBatchedStore, createSessionId} from '@sanity/telemetry'
import {DeferredTelemetryProvider, TelemetryProvider} from '@sanity/telemetry/react'
import {render} from '@testing-library/react'
import {StrictMode} from 'react'
import {afterEach, beforeEach, expect, it, vi} from 'vitest'

function createFakeLocks(): LockManager {
  const held: string[] = []
  const locks = {
    request: async (name: string, callback: () => Promise<void>) => {
      held.push(name)
      await callback()
      held.splice(held.indexOf(name), 1)
    },
    query: () => Promise.resolve({held: held.map((name) => ({name, mode: 'exclusive'}))}),
  }
  return locks as unknown as LockManager
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
  vi.stubGlobal('navigator', {...navigator, locks: createFakeLocks()})
  vi.stubGlobal(
    'fetch',
    vi.fn(() => new Promise(() => undefined)),
  )

  const {ListenerStallTelemetry, ListenerStallWorkspaceLogger} =
    await import('../ListenerStallTelemetry')
  const {resolveListenerCountingFetch} = await import('../../../network/listenerCount')
  const {startTrackingStudioTabs} = await import('../../../network/studioTabs')
  const {ListenerStallDetected} = await import('../../__telemetry__/listeners.telemetry')

  const store = createBatchedStore(createSessionId(), {
    resolveConsent: () => Promise.resolve({status: 'granted'}),
    sendEvents: () => Promise.resolve(),
    sendBeacon: () => true,
  })
  const countingFetch = resolveListenerCountingFetch()

  startTrackingStudioTabs('api.sanity.io')
  await vi.runAllTimersAsync()

  return {
    ListenerStallTelemetry,
    ListenerStallDetected,
    store,
    stallBoot: async () => {
      void countingFetch('https://abc123.api.sanity.io/v1/users/me')
      await vi.advanceTimersByTimeAsync(10_000)
    },
    workspaceReporter: (
      <TelemetryProvider store={store}>
        <ListenerStallWorkspaceLogger telemetry={store.logger} />
      </TelemetryProvider>
    ),
  }
}

const expectedBootStallEvent = {
  kind: 'not-listener-limit',
  listenersAllTabs: 0,
  listenersThisTab: 0,
  listenersOtherTabs: 0,
  knownStudioTabs: 1,
  unknownStudioTabs: 0,
  stalledListenersThisTab: 0,
  stalledOtherTabs: 0,
  isBootStall: true,
  stallOccurrence: 1,
  stalledForMs: expect.any(Number),
  protocol: 'unknown',
  budget: 80,
}

it('buffers a boot stall detected before any workspace store mounts, and sends it once one does', async () => {
  const {ListenerStallTelemetry, ListenerStallDetected, store, stallBoot, workspaceReporter} =
    await setUpStall()
  const resumeSpy = vi.spyOn(store.logger, 'resume')

  const {rerender} = render(
    <DeferredTelemetryProvider>
      <ListenerStallTelemetry />
    </DeferredTelemetryProvider>,
  )
  await stallBoot()
  expect(resumeSpy).not.toHaveBeenCalled()

  rerender(
    <DeferredTelemetryProvider>
      <ListenerStallTelemetry />
      {workspaceReporter}
    </DeferredTelemetryProvider>,
  )

  await vi.waitFor(() =>
    expect(resumeSpy).toHaveBeenCalledWith([
      expect.objectContaining({event: ListenerStallDetected, data: expectedBootStallEvent}),
    ]),
  )
})

it('logs a stall already active before mount exactly once under StrictMode', async () => {
  const {ListenerStallTelemetry, ListenerStallDetected, store, stallBoot, workspaceReporter} =
    await setUpStall()
  const logSpy = vi.spyOn(store.logger, 'log')
  await stallBoot()

  render(
    <StrictMode>
      <DeferredTelemetryProvider>
        <ListenerStallTelemetry />
        {workspaceReporter}
      </DeferredTelemetryProvider>
    </StrictMode>,
  )

  await vi.waitFor(() =>
    expect(logSpy).toHaveBeenCalledWith(ListenerStallDetected, expectedBootStallEvent),
  )
  expect(logSpy).toHaveBeenCalledTimes(1)
})

it('logs one event per stall straight to the workspace store when two instances are mounted', async () => {
  const {ListenerStallTelemetry, ListenerStallDetected, store, stallBoot, workspaceReporter} =
    await setUpStall()
  const logSpy = vi.spyOn(store.logger, 'log')

  render(
    <DeferredTelemetryProvider>
      <ListenerStallTelemetry />
      <ListenerStallTelemetry />
      {workspaceReporter}
    </DeferredTelemetryProvider>,
  )
  await stallBoot()

  await vi.waitFor(() =>
    expect(logSpy).toHaveBeenCalledWith(ListenerStallDetected, expectedBootStallEvent),
  )
  expect(logSpy).toHaveBeenCalledTimes(1)
})

it('falls back to the deferred logger after the workspace logger unmounts', async () => {
  const {ListenerStallTelemetry, ListenerStallDetected, store, stallBoot, workspaceReporter} =
    await setUpStall()
  const logSpy = vi.spyOn(store.logger, 'log')
  const resumeSpy = vi.spyOn(store.logger, 'resume')

  const {rerender} = render(
    <DeferredTelemetryProvider>
      <ListenerStallTelemetry />
      {workspaceReporter}
    </DeferredTelemetryProvider>,
  )
  rerender(
    <DeferredTelemetryProvider>
      <ListenerStallTelemetry />
    </DeferredTelemetryProvider>,
  )
  await stallBoot()
  expect(logSpy).not.toHaveBeenCalled()

  rerender(
    <DeferredTelemetryProvider>
      <ListenerStallTelemetry />
      {workspaceReporter}
    </DeferredTelemetryProvider>,
  )

  await vi.waitFor(() =>
    expect(resumeSpy).toHaveBeenCalledWith([
      expect.objectContaining({event: ListenerStallDetected, data: expectedBootStallEvent}),
    ]),
  )
})
