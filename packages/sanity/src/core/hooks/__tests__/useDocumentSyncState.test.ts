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
    // The pending floor still applies, so nothing shows for the first 10s
    // (a normal commit completes well within that and never flashes).
    vi.advanceTimersByTime(5_000)
    expect(states).toEqual(['synced'])
    // Past the floor, connected → assume the backlog is flushing, not stuck.
    vi.advanceTimersByTime(5_000)
    expect(states).toEqual(['synced', 'recovering'])
    sub.unsubscribe()
  })

  it('falls back recovering → stalled when connected but the backlog never drains', () => {
    const consistency$ = new Subject<boolean>()
    const connection$ = new BehaviorSubject<ConnectionState>('connected')
    const {states, sub} = subscribe(consistency$, connection$)
    consistency$.next(false)
    // Past the pending floor and connected → start by reassuring (`recovering`).
    vi.advanceTimersByTime(10_000)
    expect(states).toEqual(['synced', 'recovering'])
    // But if commits never get through (consistency stays false), a live
    // connection is not enough — after the grace window stop reassuring and
    // lock as `stalled`.
    vi.advanceTimersByTime(10_000)
    expect(states).toEqual(['synced', 'recovering', 'stalled'])
    // And it stays stalled.
    vi.advanceTimersByTime(60_000)
    expect(states).toEqual(['synced', 'recovering', 'stalled'])
    sub.unsubscribe()
  })

  it('clears recovering → synced if the backlog drains within the grace window', () => {
    const consistency$ = new Subject<boolean>()
    const connection$ = new BehaviorSubject<ConnectionState>('connected')
    const {states, sub} = subscribe(consistency$, connection$)
    consistency$.next(false)
    vi.advanceTimersByTime(10_000)
    expect(states).toEqual(['synced', 'recovering'])
    // Backlog drains before the grace timer fires → straight back to synced,
    // never escalating to stalled.
    vi.advanceTimersByTime(2_000)
    consistency$.next(true)
    vi.advanceTimersByTime(60_000)
    expect(states).toEqual(['synced', 'recovering', 'synced'])
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

  it('after reconnect, falls back recovering → stalled if commits still never land', () => {
    const consistency$ = new Subject<boolean>()
    const connection$ = new BehaviorSubject<ConnectionState>('reconnecting')
    const {states, sub} = subscribe(consistency$, connection$)
    consistency$.next(false)
    vi.advanceTimersByTime(30_000)
    expect(states).toEqual(['synced', 'pending', 'stalled'])

    // Reconnect, but commits keep failing (e.g. a document-specific 5xx
    // retrying on backoff while the listener is perfectly connected).
    connection$.next('connected')
    expect(states).toEqual(['synced', 'pending', 'stalled', 'recovering'])

    // We don't reassure forever: past the grace window, back to stalled.
    vi.advanceTimersByTime(10_000)
    expect(states).toEqual(['synced', 'pending', 'stalled', 'recovering', 'stalled'])
    sub.unsubscribe()
  })

  it('does not flap recovering ↔ stalled when the stage timer ticks while connected', () => {
    // Regression guard for the custom `distinctUntilChanged` comparator +
    // `isConnected$` boolean collapse. While connected and unsynced, the state
    // machine shows `recovering` then falls back to `stalled` after the grace
    // window. Independently, the underlying stage$ timer keeps ticking
    // (pending → stalled at STALLED_AFTER_MS = 30s). That stage tick must NOT
    // re-fire the connected branch's switchMap — otherwise its grace timer
    // restarts and the state flaps back to `recovering` before settling on
    // `stalled` again.
    const consistency$ = new Subject<boolean>()
    const connection$ = new BehaviorSubject<ConnectionState>('connected')
    const {states, sub} = subscribe(consistency$, connection$)
    consistency$.next(false)

    // Past the pending floor (10s), connected → `recovering`.
    vi.advanceTimersByTime(10_000)
    expect(states).toEqual(['synced', 'recovering'])

    // Grace window (10s) elapses without draining → `stalled`.
    vi.advanceTimersByTime(10_000)
    expect(states).toEqual(['synced', 'recovering', 'stalled'])

    // Cross the 30s STALLED_AFTER_MS boundary, where stage$ ticks
    // pending → stalled underneath. With the flap-guard this is a no-op; the
    // state stays `stalled`. Without it, switchMap re-fires and we'd see a
    // spurious `recovering` (then `stalled` again).
    vi.advanceTimersByTime(20_000)
    expect(states).toEqual(['synced', 'recovering', 'stalled'])

    // And it stays put well past any restarted grace timer.
    vi.advanceTimersByTime(60_000)
    expect(states).toEqual(['synced', 'recovering', 'stalled'])
    sub.unsubscribe()
  })

  it('handles a connected → disconnected → connected cycle while unsynced', () => {
    const consistency$ = new Subject<boolean>()
    const connection$ = new BehaviorSubject<ConnectionState>('connected')
    const {states, sub} = subscribe(consistency$, connection$)
    consistency$.next(false)

    // Connected past the pending floor → `recovering`.
    vi.advanceTimersByTime(10_000)
    expect(states).toEqual(['synced', 'recovering'])

    // Connection drops while still unsynced. The stage has already escalated
    // past PENDING_AFTER_MS (a pending tick fired at 10s), so the disconnected
    // branch shows the current stage — `pending`.
    connection$.next('reconnecting')
    expect(states).toEqual(['synced', 'recovering', 'pending'])

    // Still disconnected: escalate to `stalled` once STALLED_AFTER_MS (30s from
    // the start of the unsynced period) is crossed.
    vi.advanceTimersByTime(20_000)
    expect(states).toEqual(['synced', 'recovering', 'pending', 'stalled'])

    // Connection returns while still unsynced → back to `recovering`.
    connection$.next('connected')
    expect(states).toEqual(['synced', 'recovering', 'pending', 'stalled', 'recovering'])

    // Backlog finally drains → `synced`.
    consistency$.next(true)
    expect(states).toEqual(['synced', 'recovering', 'pending', 'stalled', 'recovering', 'synced'])
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
