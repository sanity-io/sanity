import {createBatchedStore, createSessionId, type TelemetryEvent} from '@sanity/telemetry'
import {TelemetryProvider} from '@sanity/telemetry/react'
import {act, render} from '@testing-library/react'
import {useEffect} from 'react'
import {firstValueFrom, Observable} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {stubDocumentVisibility} from '../../../../../test/testUtils/documentVisibility'
import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {
  LISTENER_PAUSE_GRACE_PERIOD,
  listenerGate,
  pauseWhileDocumentHidden,
} from '../../../store/listenerGate/listenerGate'
import {ListenerGateController} from '../ListenerGateController'

function createListener() {
  const state = {connections: 0}
  const source = new Observable<never>(() => {
    state.connections++
  })
  return {source, state}
}

/** Subscribes from a passive effect, like `useObservable` does */
function ListenerConsumer({source}: {source: Observable<never>}) {
  useEffect(() => {
    const subscription = source.pipe(pauseWhileDocumentHidden()).subscribe()
    return () => subscription.unsubscribe()
  }, [source])
  return null
}

function logged(events: TelemetryEvent[]) {
  return events.flatMap((event) => (event.type === 'log' ? [event] : []))
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

async function renderWithFlag(enabled: boolean | undefined, source: Observable<never>) {
  const TestProvider = await createTestProvider({
    config: {beta: {releaseBackgroundListeners: {enabled}}},
  })
  const telemetry = createCollectingStore()
  const view = render(
    <TestProvider>
      <TelemetryProvider store={telemetry.store}>
        <ListenerGateController />
        <ListenerConsumer source={source} />
      </TelemetryProvider>
    </TestProvider>,
  )
  return {...view, telemetry}
}

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('ListenerGateController', () => {
  describe('on a page opened in the background', () => {
    let documentVisibility: ReturnType<typeof stubDocumentVisibility>
    beforeEach(() => {
      documentVisibility = stubDocumentVisibility('hidden')
    })

    it('keeps listeners from connecting when the workspace enables the gate', async () => {
      const listener = createListener()
      const {unmount} = await renderWithFlag(true, listener.source)

      expect(await firstValueFrom(listenerGate.active$)).toBe(false)
      expect(listener.state.connections).toBe(0)

      act(() => documentVisibility.set('visible'))
      expect(listener.state.connections).toBe(1)

      unmount()
    })

    it('connects listeners when the workspace does not enable the gate', async () => {
      const listener = createListener()
      const {unmount} = await renderWithFlag(undefined, listener.source)

      expect(await firstValueFrom(listenerGate.active$)).toBe(true)
      expect(listener.state.connections).toBe(1)

      unmount()
    })

    it('disables the gate when the workspace unmounts', async () => {
      const {unmount} = await renderWithFlag(true, createListener().source)
      expect(await firstValueFrom(listenerGate.active$)).toBe(false)

      unmount()
      expect(await firstValueFrom(listenerGate.active$)).toBe(true)
    })

    it('does not report the first connection as a resume', async () => {
      const {unmount, telemetry} = await renderWithFlag(true, createListener().source)

      act(() => documentVisibility.set('visible'))
      await telemetry.store.flush()
      expect(telemetry.sent).toEqual([])

      unmount()
    })
  })

  describe('telemetry', () => {
    let documentVisibility: ReturnType<typeof stubDocumentVisibility>
    beforeEach(() => {
      documentVisibility = stubDocumentVisibility('visible')
    })

    it('reports a pause, and a resume when the page is shown again', async () => {
      const {unmount, telemetry} = await renderWithFlag(true, createListener().source)
      vi.useFakeTimers()

      act(() => documentVisibility.set('hidden'))
      act(() => {
        vi.advanceTimersByTime(LISTENER_PAUSE_GRACE_PERIOD + 5_000)
      })
      act(() => documentVisibility.set('visible'))
      unmount()
      vi.useRealTimers()
      await telemetry.store.flush()

      expect(logged(telemetry.sent).map(({name}) => name)).toEqual([
        'Listeners Paused',
        'Listeners Resumed',
      ])
      expect(logged(telemetry.sent)[1]).toMatchObject({data: {reason: 'visible'}})
    })

    it('reports a resume for a hold on a page that stays hidden', async () => {
      const {unmount, telemetry} = await renderWithFlag(true, createListener().source)
      vi.useFakeTimers()

      act(() => documentVisibility.set('hidden'))
      act(() => {
        vi.advanceTimersByTime(LISTENER_PAUSE_GRACE_PERIOD)
      })
      const release = listenerGate.acquireHold()
      release()
      unmount()
      vi.useRealTimers()
      await telemetry.store.flush()

      expect(logged(telemetry.sent).map(({name}) => name)).toEqual([
        'Listeners Paused',
        'Listeners Resumed',
        'Listeners Paused',
      ])
      expect(logged(telemetry.sent)[1]).toMatchObject({data: {reason: 'hold'}})
    })

    it('reports nothing while the workspace does not enable the gate', async () => {
      const {unmount, telemetry} = await renderWithFlag(false, createListener().source)
      vi.useFakeTimers()

      act(() => documentVisibility.set('hidden'))
      act(() => {
        vi.advanceTimersByTime(LISTENER_PAUSE_GRACE_PERIOD)
      })
      act(() => documentVisibility.set('visible'))
      unmount()
      vi.useRealTimers()
      await telemetry.store.flush()

      expect(telemetry.sent).toEqual([])
    })
  })
})
