import {Subject} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {type ConnectionState, toConnectionState} from '../useConnectionState'

function subscribe() {
  const events = new Subject<{type: string}>()
  const states: ConnectionState[] = []
  const subscription = events.pipe(toConnectionState()).subscribe((state) => states.push(state))
  return {events, states, subscription}
}

describe('toConnectionState', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('connects when the listener opens a connection', () => {
    const {events, states} = subscribe()
    events.next({type: 'welcome'})
    expect(states).toEqual(['connecting', 'connected'])
  })

  it('does not connect on a snapshot loaded while the listener is down', () => {
    const {events, states} = subscribe()
    events.next({type: 'reconnect'})
    events.next({type: 'snapshot'})
    vi.advanceTimersByTime(200)
    events.next({type: 'snapshot'})
    expect(states).toEqual(['connecting', 'reconnecting'])
  })

  it('reconnects after a short grace period, and connects again when the listener comes back', () => {
    const {events, states} = subscribe()
    events.next({type: 'welcome'})
    events.next({type: 'reconnect'})
    vi.advanceTimersByTime(199)
    expect(states).toEqual(['connecting', 'connected'])
    vi.advanceTimersByTime(1)
    expect(states).toEqual(['connecting', 'connected', 'reconnecting'])

    events.next({type: 'welcomeback'})
    expect(states.at(-1)).toBe('connected')
  })

  it.each(['mutation', 'pending', 'rebase', 'committed'])(
    'keeps reconnecting on a %s event',
    (type) => {
      const {events, states} = subscribe()
      events.next({type: 'reconnect'})
      vi.advanceTimersByTime(200)
      events.next({type})
      expect(states).toEqual(['connecting', 'reconnecting'])
    },
  )

  it('connects on a reset', () => {
    const {events, states} = subscribe()
    events.next({type: 'reconnect'})
    vi.advanceTimersByTime(200)
    events.next({type: 'reset'})
    expect(states).toEqual(['connecting', 'reconnecting', 'connected'])
  })
})
