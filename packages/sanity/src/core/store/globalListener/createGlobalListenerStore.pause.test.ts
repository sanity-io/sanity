import {createClient} from '@sanity/client'
import {Observable} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {stubDocumentVisibility} from '../../../../test/testUtils/documentVisibility'
import {LISTENER_RESET_DELAY} from '../../preview/constants'
import {LISTENER_PAUSE_GRACE_PERIOD, listenerGate} from '../listenerGate/listenerGate'
import {createGlobalListenerStore} from './createGlobalListenerStore'

function setup(initialVisibility: DocumentVisibilityState = 'visible') {
  const documentVisibility = stubDocumentVisibility(initialVisibility)
  const client = createClient({
    projectId: 'abc',
    dataset: 'production',
    apiVersion: '2025-02-19',
    useCdn: false,
  })
  const connections = {opened: 0, open: 0}
  vi.spyOn(client, 'withConfig').mockReturnValue(client)
  vi.spyOn(client, 'listen').mockImplementation(
    () =>
      new Observable((subscriber) => {
        connections.opened++
        connections.open++
        // The server welcomes a connection once it is established, never synchronously
        const welcome = setTimeout(() =>
          subscriber.next({type: 'welcome', listenerName: 'preview.global'}),
        )
        return () => {
          clearTimeout(welcome)
          connections.open--
        }
      }) as never,
  )
  return {documentVisibility, connections, store: createGlobalListenerStore({client})}
}

beforeEach(() => {
  vi.useFakeTimers()
  listenerGate.setEnabled(true)
})

afterEach(() => {
  // Close the shared connection, which otherwise keeps the module-level gate's page visibility
  // subscribed into the next test
  vi.advanceTimersByTime(LISTENER_RESET_DELAY)
  listenerGate.setEnabled(false)
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('createGlobalListenerStore while the page is hidden', () => {
  it('disconnects on a hidden page, and connects again when shown', () => {
    const {documentVisibility, connections, store} = setup()
    const events: string[] = []
    const subscription = store.globalListener.subscribe((event) => events.push(event.type))
    vi.advanceTimersByTime(0)

    documentVisibility.set('hidden')
    vi.advanceTimersByTime(LISTENER_PAUSE_GRACE_PERIOD)
    expect(connections).toEqual({opened: 1, open: 0})

    documentVisibility.set('visible')
    vi.advanceTimersByTime(0)
    expect(connections).toEqual({opened: 2, open: 1})
    expect(events).toEqual(['connected', 'connected'])
    subscription.unsubscribe()
  })

  it('tells a subscriber that arrives while paused to load now, and again once connected', () => {
    const {documentVisibility, store} = setup()
    const first = store.invalidationChannel.subscribe()
    vi.advanceTimersByTime(0)

    documentVisibility.set('hidden')
    vi.advanceTimersByTime(LISTENER_PAUSE_GRACE_PERIOD)
    const events: string[] = []
    const late = store.invalidationChannel.subscribe((event) => events.push(event.type))
    // The pause replaces the replayed `welcome` with a `reconnect`: the subscriber has nothing
    // loaded, so it loads without the listener rather than trusting the old connection
    expect(events).toEqual(['connected'])

    documentVisibility.set('visible')
    vi.advanceTimersByTime(0)
    expect(events).toEqual(['connected', 'connected'])
    first.unsubscribe()
    late.unsubscribe()
  })

  it('does not connect on a page opened in the background until it is shown', () => {
    const {documentVisibility, connections, store} = setup('hidden')
    const subscription = store.globalListener.subscribe()
    expect(connections.opened).toBe(0)

    documentVisibility.set('visible')
    expect(connections).toEqual({opened: 1, open: 1})
    subscription.unsubscribe()
  })
})
