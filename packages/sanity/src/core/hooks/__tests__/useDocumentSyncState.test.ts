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
    commitFailed$: BehaviorSubject<boolean>,
  ) {
    const states: DocumentSyncState[] = []
    const sub = deriveDocumentSyncState(consistency$, connection$, commitFailed$).subscribe((s) =>
      states.push(s),
    )
    return {states, sub}
  }

  it('stays synced while consistent', () => {
    const consistency$ = new Subject<boolean>()
    const connection$ = new BehaviorSubject<ConnectionState>('connected')
    const commitFailed$ = new BehaviorSubject(false)
    const {states, sub} = subscribe(consistency$, connection$, commitFailed$)
    consistency$.next(true)
    vi.advanceTimersByTime(60_000)
    expect(states).toEqual(['synced'])
    sub.unsubscribe()
  })

  it('does not warn for a brief unsynced blip under the threshold', () => {
    const consistency$ = new Subject<boolean>()
    // Disconnected so the blip would escalate if it lasted.
    const connection$ = new BehaviorSubject<ConnectionState>('reconnecting')
    const commitFailed$ = new BehaviorSubject(false)
    const {states, sub} = subscribe(consistency$, connection$, commitFailed$)
    consistency$.next(false)
    vi.advanceTimersByTime(5_000)
    consistency$.next(true)
    vi.advanceTimersByTime(60_000)
    expect(states).toEqual(['synced'])
    sub.unsubscribe()
  })

  it('escalates synced → pending → stalled while unsynced AND disconnected', () => {
    // Disconnection is a problem in itself — the escalation requires no
    // commit-failure evidence.
    const consistency$ = new Subject<boolean>()
    const connection$ = new BehaviorSubject<ConnectionState>('reconnecting')
    const commitFailed$ = new BehaviorSubject(false)
    const {states, sub} = subscribe(consistency$, connection$, commitFailed$)
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

  it('stays synced while unsynced-but-connected when no commit has failed (slow backlog)', () => {
    // THE regression this state machine must not reintroduce: a connected
    // document with a slow-draining backlog (sustained typing, saturated
    // request pipeline) but commits succeeding must never warn or lock.
    const consistency$ = new Subject<boolean>()
    const connection$ = new BehaviorSubject<ConnectionState>('connected')
    const commitFailed$ = new BehaviorSubject(false)
    const {states, sub} = subscribe(consistency$, connection$, commitFailed$)
    consistency$.next(false)
    // Stay unsynced far past every threshold — still nothing to show.
    vi.advanceTimersByTime(120_000)
    expect(states).toEqual(['synced'])
    consistency$.next(true)
    expect(states).toEqual(['synced'])
    sub.unsubscribe()
  })

  it('shows `recovering` when unsynced, connected, and a commit failed', () => {
    const consistency$ = new Subject<boolean>()
    const connection$ = new BehaviorSubject<ConnectionState>('connected')
    const commitFailed$ = new BehaviorSubject(false)
    const {states, sub} = subscribe(consistency$, connection$, commitFailed$)
    consistency$.next(false)
    commitFailed$.next(true)
    // The pending floor still applies, so nothing shows for the first 10s
    // (a failure retried successfully within that never flashes).
    vi.advanceTimersByTime(10_000)
    expect(states).toEqual(['synced'])
    // Past the floor there's still a short debounce, giving the retry a
    // chance to get through before anything is shown.
    vi.advanceTimersByTime(5_500)
    expect(states).toEqual(['synced', 'recovering'])
    sub.unsubscribe()
  })

  it('does not flash recovering for a failure whose retry succeeds within the debounce', () => {
    // Even past the pending floor (e.g. sustained typing with a long-lived
    // backlog), a single transient failure must not flash the toast if the
    // retry promptly gets through.
    const consistency$ = new Subject<boolean>()
    const connection$ = new BehaviorSubject<ConnectionState>('connected')
    const commitFailed$ = new BehaviorSubject(false)
    const {states, sub} = subscribe(consistency$, connection$, commitFailed$)
    consistency$.next(false)
    // Unsynced well past the floor with commits succeeding — nothing shown.
    vi.advanceTimersByTime(15_000)
    expect(states).toEqual(['synced'])
    // A commit fails, and its retry (~1s backoff) succeeds within the
    // debounce window.
    commitFailed$.next(true)
    vi.advanceTimersByTime(2_000)
    commitFailed$.next(false)
    vi.advanceTimersByTime(60_000)
    expect(states).toEqual(['synced'])
    sub.unsubscribe()
  })

  it('does not show anything if the failed commit recovers before the pending floor', () => {
    const consistency$ = new Subject<boolean>()
    const connection$ = new BehaviorSubject<ConnectionState>('connected')
    const commitFailed$ = new BehaviorSubject(false)
    const {states, sub} = subscribe(consistency$, connection$, commitFailed$)
    consistency$.next(false)
    commitFailed$.next(true)
    // The retry succeeds well within the pending floor.
    vi.advanceTimersByTime(5_000)
    commitFailed$.next(false)
    vi.advanceTimersByTime(60_000)
    expect(states).toEqual(['synced'])
    sub.unsubscribe()
  })

  it('clears recovering → synced as soon as a retry succeeds, before consistency returns', () => {
    const consistency$ = new Subject<boolean>()
    const connection$ = new BehaviorSubject<ConnectionState>('connected')
    const commitFailed$ = new BehaviorSubject(false)
    const {states, sub} = subscribe(consistency$, connection$, commitFailed$)
    consistency$.next(false)
    commitFailed$.next(true)
    vi.advanceTimersByTime(15_500)
    expect(states).toEqual(['synced', 'recovering'])
    // A retry lands (commit success) while the backlog is still draining —
    // commits are getting through again, so stop warning immediately.
    commitFailed$.next(false)
    expect(states).toEqual(['synced', 'recovering', 'synced'])
    vi.advanceTimersByTime(60_000)
    expect(states).toEqual(['synced', 'recovering', 'synced'])
    sub.unsubscribe()
  })

  it('falls back recovering → stalled when connected but commits keep failing', () => {
    const consistency$ = new Subject<boolean>()
    const connection$ = new BehaviorSubject<ConnectionState>('connected')
    const commitFailed$ = new BehaviorSubject(false)
    const {states, sub} = subscribe(consistency$, connection$, commitFailed$)
    consistency$.next(false)
    commitFailed$.next(true)
    // Past the pending floor and the debounce, connected + failing → start
    // by reassuring.
    vi.advanceTimersByTime(15_500)
    expect(states).toEqual(['synced', 'recovering'])
    // But if the retries never get through (still failing, still unsynced),
    // stop reassuring after the grace window and lock as `stalled`.
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
    const commitFailed$ = new BehaviorSubject(false)
    const {states, sub} = subscribe(consistency$, connection$, commitFailed$)
    consistency$.next(false)
    commitFailed$.next(true)
    vi.advanceTimersByTime(15_500)
    expect(states).toEqual(['synced', 'recovering'])
    // Backlog drains before the grace timer fires → straight back to synced,
    // never escalating to stalled.
    vi.advanceTimersByTime(2_000)
    consistency$.next(true)
    vi.advanceTimersByTime(60_000)
    expect(states).toEqual(['synced', 'recovering', 'synced'])
    sub.unsubscribe()
  })

  it('switches stalled → recovering shortly after the connection returns', () => {
    const consistency$ = new Subject<boolean>()
    const connection$ = new BehaviorSubject<ConnectionState>('reconnecting')
    const commitFailed$ = new BehaviorSubject(false)
    const {states, sub} = subscribe(consistency$, connection$, commitFailed$)
    consistency$.next(false)
    // Commit attempts fail with network errors while offline.
    commitFailed$.next(true)
    vi.advanceTimersByTime(30_000)
    expect(states).toEqual(['synced', 'pending', 'stalled'])

    // Reconnect while edits still haven't flushed. The debounce holds the
    // current state briefly — if the flush succeeds within it, we'd go
    // straight back to synced without ever showing `recovering`.
    connection$.next('connected')
    expect(states).toEqual(['synced', 'pending', 'stalled'])
    vi.advanceTimersByTime(5_500)
    expect(states).toEqual(['synced', 'pending', 'stalled', 'recovering'])

    // Backlog drains.
    commitFailed$.next(false)
    consistency$.next(true)
    expect(states).toEqual(['synced', 'pending', 'stalled', 'recovering', 'synced'])
    sub.unsubscribe()
  })

  it('after reconnect, falls back recovering → stalled if commits still never land', () => {
    const consistency$ = new Subject<boolean>()
    const connection$ = new BehaviorSubject<ConnectionState>('reconnecting')
    const commitFailed$ = new BehaviorSubject(false)
    const {states, sub} = subscribe(consistency$, connection$, commitFailed$)
    consistency$.next(false)
    commitFailed$.next(true)
    vi.advanceTimersByTime(30_000)
    expect(states).toEqual(['synced', 'pending', 'stalled'])

    // Reconnect, but commits keep failing (e.g. a document-specific 5xx
    // retrying on backoff while the listener is perfectly connected).
    connection$.next('connected')
    vi.advanceTimersByTime(5_500)
    expect(states).toEqual(['synced', 'pending', 'stalled', 'recovering'])

    // We don't reassure forever: past the grace window, back to stalled.
    vi.advanceTimersByTime(10_000)
    expect(states).toEqual(['synced', 'pending', 'stalled', 'recovering', 'stalled'])
    sub.unsubscribe()
  })

  it('does not flap recovering ↔ stalled when the stage timer ticks while connected', () => {
    // Regression guard for collapsing the inputs to the underlying sync
    // state before the time-boxed switchMap. While connected and failing,
    // the state machine shows `recovering` then falls back to `stalled`
    // after the grace window. Independently, the underlying stage$ timer
    // keeps ticking (pending → stalled at STALLED_AFTER_MS = 30s). That
    // stage tick must NOT re-fire the retrying switchMap — otherwise its
    // grace timer restarts and the state flaps back to `recovering` before
    // settling on `stalled` again.
    const consistency$ = new Subject<boolean>()
    const connection$ = new BehaviorSubject<ConnectionState>('connected')
    const commitFailed$ = new BehaviorSubject(false)
    const {states, sub} = subscribe(consistency$, connection$, commitFailed$)
    consistency$.next(false)
    commitFailed$.next(true)

    // Past the pending floor (10s) and the debounce (5.5s), connected +
    // failing → `recovering`.
    vi.advanceTimersByTime(15_500)
    expect(states).toEqual(['synced', 'recovering'])

    // Grace window (10s) elapses without draining → `stalled`.
    vi.advanceTimersByTime(10_000)
    expect(states).toEqual(['synced', 'recovering', 'stalled'])

    // Cross the 30s STALLED_AFTER_MS boundary, where stage$ ticks
    // pending → stalled underneath. With the input collapse this is a no-op;
    // the state stays `stalled`. Without it, switchMap re-fires and we'd see a
    // spurious gap (debounce) then `recovering` and `stalled` again.
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
    const commitFailed$ = new BehaviorSubject(false)
    const {states, sub} = subscribe(consistency$, connection$, commitFailed$)
    consistency$.next(false)
    commitFailed$.next(true)

    // Connected + failing past the pending floor and debounce → `recovering`.
    vi.advanceTimersByTime(15_500)
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

    // Connection returns while still unsynced and failing → back to
    // `recovering` after the debounce.
    connection$.next('connected')
    vi.advanceTimersByTime(5_500)
    expect(states).toEqual(['synced', 'recovering', 'pending', 'stalled', 'recovering'])

    // Backlog finally drains → `synced`.
    consistency$.next(true)
    expect(states).toEqual(['synced', 'recovering', 'pending', 'stalled', 'recovering', 'synced'])
    sub.unsubscribe()
  })

  it('recovers to synced as soon as consistency returns, and restarts cleanly', () => {
    const consistency$ = new Subject<boolean>()
    const connection$ = new BehaviorSubject<ConnectionState>('reconnecting')
    const commitFailed$ = new BehaviorSubject(false)
    const {states, sub} = subscribe(consistency$, connection$, commitFailed$)
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
