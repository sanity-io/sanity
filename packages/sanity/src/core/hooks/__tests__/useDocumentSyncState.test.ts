import {Subject} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {deriveDocumentSyncState, type DocumentSyncState} from '../useDocumentSyncState'

describe('deriveDocumentSyncState', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  function subscribe(consistency$: Subject<boolean>) {
    const states: DocumentSyncState[] = []
    const sub = deriveDocumentSyncState(consistency$).subscribe((s) => states.push(s))
    return {states, sub}
  }

  it('stays synced while consistent', () => {
    const consistency$ = new Subject<boolean>()
    const {states, sub} = subscribe(consistency$)
    consistency$.next(true)
    vi.advanceTimersByTime(60_000)
    expect(states).toEqual(['synced'])
    sub.unsubscribe()
  })

  it('does not warn for a brief unsynced blip (commit under the threshold)', () => {
    const consistency$ = new Subject<boolean>()
    const {states, sub} = subscribe(consistency$)
    consistency$.next(false)
    vi.advanceTimersByTime(5_000) // under PENDING_AFTER_MS
    consistency$.next(true)
    vi.advanceTimersByTime(60_000)
    // 'synced' is emitted on subscribe-to-unsynced (startWith) and again on
    // recovery; distinctUntilChanged collapses them — never reached 'pending'.
    expect(states).toEqual(['synced'])
    sub.unsubscribe()
  })

  it('escalates synced → pending → stalled while unsynced', () => {
    const consistency$ = new Subject<boolean>()
    const {states, sub} = subscribe(consistency$)
    consistency$.next(false)
    expect(states).toEqual(['synced'])

    vi.advanceTimersByTime(10_000) // PENDING_AFTER_MS
    expect(states).toEqual(['synced', 'pending'])

    vi.advanceTimersByTime(20_000) // STALLED_AFTER_MS total
    expect(states).toEqual(['synced', 'pending', 'stalled'])

    // Stays stalled, doesn't churn.
    vi.advanceTimersByTime(60_000)
    expect(states).toEqual(['synced', 'pending', 'stalled'])
    sub.unsubscribe()
  })

  it('recovers to synced as soon as consistency returns, from pending', () => {
    const consistency$ = new Subject<boolean>()
    const {states, sub} = subscribe(consistency$)
    consistency$.next(false)
    vi.advanceTimersByTime(10_000)
    expect(states).toEqual(['synced', 'pending'])

    consistency$.next(true)
    expect(states).toEqual(['synced', 'pending', 'synced'])
    sub.unsubscribe()
  })

  it('recovers to synced from stalled, and the timer is torn down', () => {
    const consistency$ = new Subject<boolean>()
    const {states, sub} = subscribe(consistency$)
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
