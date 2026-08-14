import {type StatusEvent} from '@sanity/comlink'
import {afterEach, beforeEach, describe, expect, test, vi, type MockInstance} from 'vitest'
import {createActor, SimulatedClock} from 'xstate'

import {
  MAX_TIME_TO_IFRAME_LOAD,
  MAX_TIME_TO_OVERLAYS_CONNECTION,
  TIME_TO_SHOW_OVERLAYS_CONNECTION_STATUS,
} from '../../constants'
import {presentationMachine} from '../presentation-machine'

const createTestActor = () => {
  const clock = new SimulatedClock()
  const actor = createActor(presentationMachine, {clock}).start()
  return {actor, clock}
}

const overlaysStatus = (
  status: StatusEvent['status'],
  connection = 'visual-editing-1',
): {type: 'overlays status'; statusEvent: StatusEvent} => ({
  type: 'overlays status',
  statusEvent: {connection, status},
})

let consoleError: MockInstance
beforeEach(() => {
  // The load and connection timeout states log troubleshooting hints on entry
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  consoleError.mockRestore()
})

describe('Presentation machine', () => {
  describe('iframe loading', () => {
    test('starts out loading and settles once the iframe loads', () => {
      const {actor} = createTestActor()

      let snapshot = actor.getSnapshot()
      expect(snapshot.matches('loading')).toBe(true)
      expect(snapshot.hasTag('busy')).toBe(true)
      expect(snapshot.hasTag('show loading overlay')).toBe(true)
      expect(snapshot.hasTag('prevent iframe interaction')).toBe(true)

      actor.send({type: 'iframe loaded'})

      snapshot = actor.getSnapshot()
      expect(snapshot.matches({loaded: 'idle'})).toBe(true)
      expect(snapshot.hasTag('busy')).toBe(false)
      expect(snapshot.hasTag('show loading overlay')).toBe(false)
      expect(snapshot.hasTag('prevent iframe interaction')).toBe(false)
    })

    test('surfaces the error card if the iframe load event never fires', () => {
      const {actor, clock} = createTestActor()

      clock.increment(MAX_TIME_TO_IFRAME_LOAD - 1)
      let snapshot = actor.getSnapshot()
      expect(snapshot.hasTag('show loading overlay')).toBe(true)
      expect(snapshot.hasTag('show error card')).toBe(false)

      clock.increment(1)
      snapshot = actor.getSnapshot()
      expect(snapshot.matches('loading')).toBe(true)
      expect(snapshot.hasTag('show loading overlay')).toBe(false)
      expect(snapshot.hasTag('show error card')).toBe(true)
      // The iframe stays blocked, the error card renders above the click-prevention overlay
      expect(snapshot.hasTag('prevent iframe interaction')).toBe(true)
      expect(consoleError).toHaveBeenCalledTimes(1)
    })

    test('retrying a timed out load restarts the load timeout', () => {
      const {actor, clock} = createTestActor()

      clock.increment(MAX_TIME_TO_IFRAME_LOAD)
      expect(actor.getSnapshot().hasTag('show error card')).toBe(true)

      actor.send({type: 'iframe reload'})

      let snapshot = actor.getSnapshot()
      expect(snapshot.matches('loading')).toBe(true)
      expect(snapshot.hasTag('show loading overlay')).toBe(true)
      expect(snapshot.hasTag('show error card')).toBe(false)

      clock.increment(MAX_TIME_TO_IFRAME_LOAD - 1)
      expect(actor.getSnapshot().hasTag('show error card')).toBe(false)
      clock.increment(1)
      expect(actor.getSnapshot().hasTag('show error card')).toBe(true)
    })

    test('a load timeout dismissal suppresses the UI, and only lasts until the load settles', () => {
      const {actor, clock} = createTestActor()

      clock.increment(MAX_TIME_TO_IFRAME_LOAD)
      actor.send({type: 'continue anyway'})

      let snapshot = actor.getSnapshot()
      expect(snapshot.matches('loading')).toBe(true)
      expect(snapshot.hasTag('busy')).toBe(true)
      expect(snapshot.hasTag('show error card')).toBe(false)
      expect(snapshot.hasTag('show loading overlay')).toBe(false)
      expect(snapshot.hasTag('prevent iframe interaction')).toBe(false)

      actor.send({type: 'iframe loaded'})
      expect(actor.getSnapshot().matches({loaded: 'idle'})).toBe(true)

      // The dismissal did not outlive the failed load: the next reload shows the loading UI again
      actor.send({type: 'iframe reload'})
      snapshot = actor.getSnapshot()
      expect(snapshot.matches({loaded: 'reloading'})).toBe(true)
      expect(snapshot.hasTag('show loading overlay')).toBe(true)
    })

    test('a reload arms the load timeout like the initial load', () => {
      const {actor, clock} = createTestActor()
      actor.send({type: 'iframe loaded'})

      actor.send({type: 'iframe reload'})

      let snapshot = actor.getSnapshot()
      expect(snapshot.matches({loaded: 'reloading'})).toBe(true)
      expect(snapshot.hasTag('busy')).toBe(true)
      expect(snapshot.hasTag('show loading overlay')).toBe(true)

      clock.increment(MAX_TIME_TO_IFRAME_LOAD)
      expect(actor.getSnapshot().hasTag('show error card')).toBe(true)

      actor.send({type: 'iframe loaded'})
      snapshot = actor.getSnapshot()
      expect(snapshot.matches({loaded: 'idle'})).toBe(true)
      expect(snapshot.hasTag('show error card')).toBe(false)
    })

    test('a refresh does not arm the load timeout', () => {
      const {actor, clock} = createTestActor()
      actor.send({type: 'iframe loaded'})

      actor.send({type: 'iframe refresh'})

      let snapshot = actor.getSnapshot()
      expect(snapshot.matches({loaded: 'refreshing'})).toBe(true)
      expect(snapshot.hasTag('busy')).toBe(true)
      expect(snapshot.hasTag('show loading overlay')).toBe(false)

      // A slow mutation or manual refresh is not a failed load
      clock.increment(MAX_TIME_TO_IFRAME_LOAD * 2)
      snapshot = actor.getSnapshot()
      expect(snapshot.matches({loaded: 'refreshing'})).toBe(true)
      expect(snapshot.hasTag('show error card')).toBe(false)

      actor.send({type: 'iframe loaded'})
      expect(actor.getSnapshot().matches({loaded: 'idle'})).toBe(true)
    })
  })

  describe('overlays connection', () => {
    test('stays quiet when the overlays connect quickly', () => {
      const {actor, clock} = createTestActor()
      actor.send({type: 'iframe loaded'})

      actor.send(overlaysStatus('handshaking'))

      let snapshot = actor.getSnapshot()
      expect(snapshot.context.overlaysConnection).toBe('connecting')
      // A first-time connection blocks the iframe and shows the loading overlay while pending
      expect(snapshot.hasTag('show loading overlay')).toBe(true)
      expect(snapshot.hasTag('prevent iframe interaction')).toBe(true)

      clock.increment(TIME_TO_SHOW_OVERLAYS_CONNECTION_STATUS - 1)
      actor.send(overlaysStatus('connected'))

      snapshot = actor.getSnapshot()
      expect(snapshot.context.overlaysConnection).toBe('connected')
      expect(snapshot.hasTag('show loading overlay')).toBe(false)
      expect(snapshot.hasTag('show overlays connection status')).toBe(false)
      expect(snapshot.hasTag('prevent iframe interaction')).toBe(false)
    })

    test('escalates a slow first-time connection to the status overlay, then the timeout', () => {
      const {actor, clock} = createTestActor()
      actor.send({type: 'iframe loaded'})
      actor.send(overlaysStatus('handshaking'))

      clock.increment(TIME_TO_SHOW_OVERLAYS_CONNECTION_STATUS - 1)
      expect(actor.getSnapshot().hasTag('show overlays connection status')).toBe(false)

      clock.increment(1)
      let snapshot = actor.getSnapshot()
      expect(snapshot.hasTag('show loading overlay')).toBe(false)
      expect(snapshot.hasTag('show overlays connection status')).toBe(true)
      expect(snapshot.hasTag('overlays connection timed out')).toBe(false)
      expect(snapshot.hasTag('prevent iframe interaction')).toBe(true)

      clock.increment(MAX_TIME_TO_OVERLAYS_CONNECTION - 1)
      expect(actor.getSnapshot().hasTag('overlays connection timed out')).toBe(false)

      clock.increment(1)
      snapshot = actor.getSnapshot()
      expect(snapshot.hasTag('show overlays connection status')).toBe(true)
      expect(snapshot.hasTag('overlays connection timed out')).toBe(true)
      expect(snapshot.hasTag('show error card')).toBe(false)
      expect(snapshot.hasTag('prevent iframe interaction')).toBe(true)
      expect(consoleError).toHaveBeenCalledTimes(1)

      // A connection resolves the timeout
      actor.send(overlaysStatus('connected'))
      snapshot = actor.getSnapshot()
      expect(snapshot.hasTag('show overlays connection status')).toBe(false)
      expect(snapshot.hasTag('overlays connection timed out')).toBe(false)
    })

    test('escalates a lost connection to the error card', () => {
      const {actor, clock} = createTestActor()
      actor.send({type: 'iframe loaded'})
      actor.send(overlaysStatus('handshaking'))
      actor.send(overlaysStatus('connected'))

      actor.send(overlaysStatus('handshaking'))

      let snapshot = actor.getSnapshot()
      expect(snapshot.context.overlaysConnection).toBe('reconnecting')
      // Reconnects get a grace period without any UI, and the iframe stays interactive
      expect(snapshot.hasTag('show loading overlay')).toBe(false)
      expect(snapshot.hasTag('prevent iframe interaction')).toBe(false)

      clock.increment(TIME_TO_SHOW_OVERLAYS_CONNECTION_STATUS)
      snapshot = actor.getSnapshot()
      expect(snapshot.hasTag('show overlays connection status')).toBe(true)
      expect(snapshot.hasTag('overlays connection timed out')).toBe(false)

      clock.increment(MAX_TIME_TO_OVERLAYS_CONNECTION)
      snapshot = actor.getSnapshot()
      expect(snapshot.hasTag('show overlays connection status')).toBe(false)
      expect(snapshot.hasTag('show error card')).toBe(true)

      actor.send(overlaysStatus('connected'))
      expect(actor.getSnapshot().hasTag('show error card')).toBe(false)
    })

    test('status changes restart the escalation timers', () => {
      const {actor, clock} = createTestActor()
      actor.send({type: 'iframe loaded'})
      actor.send(overlaysStatus('handshaking'))

      clock.increment(TIME_TO_SHOW_OVERLAYS_CONNECTION_STATUS - 1)
      // A second connection starts handshaking (e.g. a popup window)
      actor.send(overlaysStatus('handshaking', 'visual-editing-2'))

      clock.increment(TIME_TO_SHOW_OVERLAYS_CONNECTION_STATUS - 1)
      expect(actor.getSnapshot().hasTag('show overlays connection status')).toBe(false)

      clock.increment(1)
      expect(actor.getSnapshot().hasTag('show overlays connection status')).toBe(true)
    })

    test('dismissing a timed out connection suppresses the UI until the overlays connect', () => {
      const {actor, clock} = createTestActor()
      actor.send({type: 'iframe loaded'})
      actor.send(overlaysStatus('handshaking'))
      clock.increment(TIME_TO_SHOW_OVERLAYS_CONNECTION_STATUS)
      clock.increment(MAX_TIME_TO_OVERLAYS_CONNECTION)
      expect(actor.getSnapshot().hasTag('overlays connection timed out')).toBe(true)

      actor.send({type: 'continue anyway'})

      let snapshot = actor.getSnapshot()
      expect(snapshot.matches({loaded: {idle: 'dismissed'}})).toBe(true)
      expect(snapshot.context.overlaysDismissed).toBe(true)
      expect(snapshot.hasTag('show overlays connection status')).toBe(false)
      expect(snapshot.hasTag('prevent iframe interaction')).toBe(false)

      // Even a fresh connection attempt stays suppressed while dismissed
      actor.send(overlaysStatus('disconnected'))
      actor.send(overlaysStatus('handshaking', 'visual-editing-2'))
      clock.increment(TIME_TO_SHOW_OVERLAYS_CONNECTION_STATUS)
      clock.increment(MAX_TIME_TO_OVERLAYS_CONNECTION)
      snapshot = actor.getSnapshot()
      expect(snapshot.hasTag('show loading overlay')).toBe(false)
      expect(snapshot.hasTag('show overlays connection status')).toBe(false)

      // A successful connection resolves the dismissal, so future failures surface again
      actor.send(overlaysStatus('connected', 'visual-editing-2'))
      expect(actor.getSnapshot().context.overlaysDismissed).toBe(false)
      actor.send(overlaysStatus('disconnected', 'visual-editing-2'))
      actor.send(overlaysStatus('handshaking', 'visual-editing-3'))
      expect(actor.getSnapshot().hasTag('show loading overlay')).toBe(true)
    })

    test('an overlays failure dismissal survives reloads until the overlays connect', () => {
      const {actor, clock} = createTestActor()
      actor.send({type: 'iframe loaded'})
      actor.send(overlaysStatus('handshaking'))
      actor.send(overlaysStatus('connected'))
      actor.send(overlaysStatus('handshaking'))
      clock.increment(TIME_TO_SHOW_OVERLAYS_CONNECTION_STATUS)
      clock.increment(MAX_TIME_TO_OVERLAYS_CONNECTION)
      expect(actor.getSnapshot().hasTag('show error card')).toBe(true)

      actor.send({type: 'continue anyway'})
      expect(actor.getSnapshot().context.overlaysDismissed).toBe(true)

      // Reloading the iframe keeps the loading UI suppressed
      actor.send({type: 'iframe reload'})
      let snapshot = actor.getSnapshot()
      expect(snapshot.matches({loaded: 'reloading'})).toBe(true)
      expect(snapshot.hasTag('busy')).toBe(true)
      expect(snapshot.hasTag('show loading overlay')).toBe(false)
      expect(snapshot.hasTag('prevent iframe interaction')).toBe(false)

      // And the load timeout stays suppressed as well
      clock.increment(MAX_TIME_TO_IFRAME_LOAD)
      expect(actor.getSnapshot().hasTag('show error card')).toBe(false)

      actor.send({type: 'iframe loaded'})
      snapshot = actor.getSnapshot()
      expect(snapshot.matches({loaded: {idle: 'dismissed'}})).toBe(true)

      // Until the overlays finally connect
      actor.send(overlaysStatus('connected'))
      expect(actor.getSnapshot().context.overlaysDismissed).toBe(false)
      actor.send({type: 'iframe reload'})
      expect(actor.getSnapshot().hasTag('show loading overlay')).toBe(true)
    })

    test('aggregates the status of multiple connections', () => {
      const {actor} = createTestActor()
      actor.send({type: 'iframe loaded'})

      actor.send(overlaysStatus('handshaking', 'connection-a'))
      expect(actor.getSnapshot().context.overlaysConnection).toBe('connecting')

      actor.send(overlaysStatus('connected', 'connection-a'))
      expect(actor.getSnapshot().context.overlaysConnection).toBe('connected')

      // Any connected connection wins
      actor.send(overlaysStatus('handshaking', 'connection-b'))
      expect(actor.getSnapshot().context.overlaysConnection).toBe('connected')

      // Losing the connected connection leaves a first-time handshake: connecting
      actor.send(overlaysStatus('disconnected', 'connection-a'))
      expect(actor.getSnapshot().context.overlaysConnection).toBe('connecting')

      // A connection that has connected before hands-shakes as a reconnect
      actor.send(overlaysStatus('connected', 'connection-b'))
      actor.send(overlaysStatus('handshaking', 'connection-b'))
      expect(actor.getSnapshot().context.overlaysConnection).toBe('reconnecting')

      actor.send(overlaysStatus('disconnected', 'connection-b'))
      expect(actor.getSnapshot().context.overlaysConnection).toBe('idle')
    })
  })

  describe('visual editing overlays toggle', () => {
    test('tracks whether the overlays are enabled', () => {
      const {actor} = createTestActor()
      actor.send({type: 'iframe loaded'})
      expect(actor.getSnapshot().context.visualEditingOverlaysEnabled).toBe(false)

      actor.send({type: 'toggle visual editing overlays', enabled: true})
      expect(actor.getSnapshot().context.visualEditingOverlaysEnabled).toBe(true)

      actor.send({type: 'toggle visual editing overlays', enabled: false})
      expect(actor.getSnapshot().context.visualEditingOverlaysEnabled).toBe(false)
    })
  })
})
