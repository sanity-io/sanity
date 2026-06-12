import {BehaviorSubject, Subject} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {type ConnectionState} from '../useConnectionState'
import {deriveDocumentSyncState, type DocumentSyncState} from '../useDocumentSyncState'

describe('deriveDocumentSyncState', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  function subscribe(
    consistency$: Subject<boolean>,
    connection$: BehaviorSubject<ConnectionState>,
  ) {
    const states: DocumentSyncState[] = []
    const sub = deriveDocumentSyncState(consistency$, connection$).subscribe((s) => states.push(s))
    return {states, sub}
  }

  it('stays synced while consistent', () => {
    const consistency$ = new Subject<boolean>()
    const connection$ = new BehaviorSubject<ConnectionState>('connected')
    const {states, sub} = subscribe(consistency$, connection$)
    consistency$.next(true)
    vi.advanceTimersByTime(60_000)
    expect(states).toEqual(['synced'])
    sub.unsubscribe()
  })

  it('does not warn for a brief unsynced blip under the threshold', () => {
    const consistency$ = new Subject<boolean>()
    // Disconnected so the blip would escalate if it lasted.
    const connection$ = new BehaviorSubject<ConnectionState>('reconnecting')
    const {states, sub} = subscribe(consistency$, connection$)
    consistency$.next(false)
    vi.advanceTimersByTime(5_000)
    consistency$.next(true)
    vi.advanceTimersByTime(60_000)
    expect(states).toEqual(['synced'])
    sub.unsubscribe()
  })

  it('escalates synced → pending → stalled while unsynced AND disconnected', () => {
    const consistency$ = new Subject<boolean>()
    const connection$ = new BehaviorSubject<ConnectionState>('reconnecting')
    const {states, sub} = subscribe(consistency$, connection$)
    consistency$.next(false)
    expect(states).toEqual(['synced'])

    vi.advanceTimersByTime(10_000)
    expect(states).toEqual(['synced', 'pending'])

    vi.advanceTimersByTime(20_000)
    expect(states).toEqual(['synced', 'pending', 'stalled'])

    vi.advanceTimersByTime(60_000)
    expect(states).toEqual(['synced', 'pending', 'stalled'])
    sub.unsubscribe()
  })

  it('shows `recovering` (not pending/stalled) when unsynced but connected', () => {
    const consistency$ = new Subject<boolean>()
    const connection$ = new BehaviorSubject<ConnectionState>('connected')
    const {states, sub} = subscribe(consistency$, connection$)
    consistency$.next(false)
    vi.advanceTimersByTime(10_000)
    // Connected the whole time → the backlog is flushing, not stuck.
    expect(states).toEqual(['synced', 'recovering'])
    sub.unsubscribe()
  })

  it('switches stalled → recovering the moment the connection returns', () => {
    const consistency$ = new Subject<boolean>()
    const connection$ = new BehaviorSubject<ConnectionState>('reconnecting')
    const {states, sub} = subscribe(consistency$, connection$)
    consistency$.next(false)
    vi.advanceTimersByTime(30_000)
    expect(states).toEqual(['synced', 'pending', 'stalled'])

    // Reconnect while edits still haven't flushed.
    connection$.next('connected')
    expect(states).toEqual(['synced', 'pending', 'stalled', 'recovering'])

    // Backlog drains.
    consistency$.next(true)
    expect(states).toEqual(['synced', 'pending', 'stalled', 'recovering', 'synced'])
    sub.unsubscribe()
  })

  it('recovers to synced as soon as consistency returns, and restarts cleanly', () => {
    const consistency$ = new Subject<boolean>()
    const connection$ = new BehaviorSubject<ConnectionState>('reconnecting')
    const {states, sub} = subscribe(consistency$, connection$)
    consistency$.next(false)
    vi.advanceTimersByTime(30_000)
    expect(states).toEqual(['synced', 'pending', 'stalled'])

    consistency$.next(true)
    expect(states).toEqual(['synced', 'pending', 'stalled', 'synced'])

    // A fresh unsynced period restarts the escalation from scratch.
    consistency$.next(false)
    vi.advanceTimersByTime(10_000)
    expect(states).toEqual(['synced', 'pending', 'stalled', 'synced', 'pending'])
    sub.unsubscribe()
  })
})
