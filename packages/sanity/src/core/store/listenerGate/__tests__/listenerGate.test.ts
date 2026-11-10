import {Observable, Subject} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {
  createListenerGate,
  getListenerPauseGracePeriod,
  LISTENER_PAUSE_GRACE_PERIOD,
  LISTENER_PAUSE_GRACE_PERIOD_STORAGE_KEY,
  type ListenerGate,
} from '../listenerGate'

function setVisibility(state: DocumentVisibilityState) {
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(state)
  document.dispatchEvent(new Event('visibilitychange'))
}

function observeActive(gate: ListenerGate) {
  const values: boolean[] = []
  const subscription = gate.active$.subscribe((active) => values.push(active))
  return {
    get latest() {
      return values.at(-1)
    },
    values,
    unsubscribe: () => subscription.unsubscribe(),
  }
}

/** A cold source that, like a listener, connects on subscription and disconnects on teardown */
function createListener() {
  const state = {connections: 0, open: 0}
  const source = new Observable<{type: 'welcome'}>((subscriber) => {
    state.connections++
    state.open++
    subscriber.next({type: 'welcome'})
    return () => {
      state.open--
    }
  })
  return {source, state}
}

function setupPauseWhileDocumentHidden() {
  const gate = createListenerGate()
  gate.enable()
  const listener = createListener()
  const events: unknown[] = []
  return {gate, listener, events}
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  localStorage.removeItem(LISTENER_PAUSE_GRACE_PERIOD_STORAGE_KEY)
})

describe('createListenerGate', () => {
  it('stays active on a hidden page while disabled', () => {
    const gate = createListenerGate()
    const active = observeActive(gate)

    setVisibility('hidden')
    vi.advanceTimersByTime(LISTENER_PAUSE_GRACE_PERIOD * 2)

    expect(active.values).toEqual([true])
    active.unsubscribe()
  })

  it('pauses once the page has been hidden for the grace period', () => {
    const gate = createListenerGate()
    gate.enable()
    const active = observeActive(gate)

    setVisibility('hidden')
    vi.advanceTimersByTime(LISTENER_PAUSE_GRACE_PERIOD - 1)
    expect(active.latest).toBe(true)

    vi.advanceTimersByTime(1)
    expect(active.values).toEqual([true, false])
    active.unsubscribe()
  })

  it('stays active when the page is shown again within the grace period', () => {
    const gate = createListenerGate()
    gate.enable()
    const active = observeActive(gate)

    setVisibility('hidden')
    vi.advanceTimersByTime(LISTENER_PAUSE_GRACE_PERIOD / 2)
    setVisibility('visible')
    vi.advanceTimersByTime(LISTENER_PAUSE_GRACE_PERIOD * 2)

    expect(active.values).toEqual([true])
    active.unsubscribe()
  })

  it('resumes as soon as the page is shown again', () => {
    const gate = createListenerGate()
    gate.enable()
    const active = observeActive(gate)

    setVisibility('hidden')
    vi.advanceTimersByTime(LISTENER_PAUSE_GRACE_PERIOD)
    setVisibility('visible')

    expect(active.values).toEqual([true, false, true])
    active.unsubscribe()
  })

  it('starts paused on a page that is hidden from the start, until it is shown', () => {
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    const gate = createListenerGate()
    gate.enable()
    const active = observeActive(gate)

    expect(active.values).toEqual([false])

    setVisibility('visible')
    expect(active.values).toEqual([false, true])
    active.unsubscribe()
  })

  it('pauses when it is enabled on a page that has been hidden past the grace period', () => {
    const gate = createListenerGate()
    const active = observeActive(gate)

    setVisibility('hidden')
    vi.advanceTimersByTime(LISTENER_PAUSE_GRACE_PERIOD)
    expect(active.latest).toBe(true)

    gate.enable()
    expect(active.values).toEqual([true, false])
    active.unsubscribe()
  })

  it('stays enabled until every caller that enabled it has released it', () => {
    const gate = createListenerGate()
    const active = observeActive(gate)
    const releaseFirst = gate.enable()
    const releaseSecond = gate.enable()

    setVisibility('hidden')
    vi.advanceTimersByTime(LISTENER_PAUSE_GRACE_PERIOD)
    expect(active.values).toEqual([true, false])

    releaseFirst()
    // Releasing the same caller again must not release the other one
    releaseFirst()
    expect(active.latest).toBe(false)

    releaseSecond()
    expect(active.values).toEqual([true, false, true])
    active.unsubscribe()
  })

  it('keeps a hold when it is disabled and enabled again', () => {
    const gate = createListenerGate()
    const releaseFirstEnable = gate.enable()
    const active = observeActive(gate)
    const release = gate.acquireHold()

    setVisibility('hidden')
    vi.advanceTimersByTime(LISTENER_PAUSE_GRACE_PERIOD)
    releaseFirstEnable()
    const releaseSecondEnable = gate.enable()
    expect(active.values).toEqual([true])

    release()
    expect(active.values).toEqual([true, false])
    releaseSecondEnable()
    active.unsubscribe()
  })

  it('stays active while a hold is acquired, and pauses when the last hold is released', () => {
    const gate = createListenerGate()
    gate.enable()
    const active = observeActive(gate)
    const releaseFirst = gate.acquireHold()
    const releaseSecond = gate.acquireHold()

    setVisibility('hidden')
    vi.advanceTimersByTime(LISTENER_PAUSE_GRACE_PERIOD * 2)
    expect(active.latest).toBe(true)

    releaseFirst()
    // Releasing the same hold again must not release the other one
    releaseFirst()
    expect(active.latest).toBe(true)

    releaseSecond()
    expect(active.values).toEqual([true, false])
    active.unsubscribe()
  })

  it('resumes when a hold is acquired while paused', () => {
    const gate = createListenerGate()
    gate.enable()
    const active = observeActive(gate)

    setVisibility('hidden')
    vi.advanceTimersByTime(LISTENER_PAUSE_GRACE_PERIOD)
    const release = gate.acquireHold()

    expect(active.values).toEqual([true, false, true])
    release()
    expect(active.values).toEqual([true, false, true, false])
    active.unsubscribe()
  })

  it('reads the grace period every time the page is hidden', () => {
    const getGracePeriod = vi.fn(() => 1_000)
    const gate = createListenerGate({getGracePeriod})
    gate.enable()
    const active = observeActive(gate)

    setVisibility('hidden')
    vi.advanceTimersByTime(1_000)
    expect(active.latest).toBe(false)

    getGracePeriod.mockReturnValue(5_000)
    setVisibility('visible')
    setVisibility('hidden')
    vi.advanceTimersByTime(1_000)
    expect(active.latest).toBe(true)
    vi.advanceTimersByTime(4_000)
    expect(active.latest).toBe(false)
    active.unsubscribe()
  })
})

describe('getListenerPauseGracePeriod', () => {
  it('defaults to the grace period constant', () => {
    expect(getListenerPauseGracePeriod()).toBe(LISTENER_PAUSE_GRACE_PERIOD)
  })

  it('reads an override from localStorage', () => {
    localStorage.setItem(LISTENER_PAUSE_GRACE_PERIOD_STORAGE_KEY, '250')
    expect(getListenerPauseGracePeriod()).toBe(250)

    localStorage.setItem(LISTENER_PAUSE_GRACE_PERIOD_STORAGE_KEY, '0')
    expect(getListenerPauseGracePeriod()).toBe(0)
  })

  it.each(['', 'soon', '-1', 'Infinity'])('ignores the invalid override %j', (override) => {
    localStorage.setItem(LISTENER_PAUSE_GRACE_PERIOD_STORAGE_KEY, override)
    expect(getListenerPauseGracePeriod()).toBe(LISTENER_PAUSE_GRACE_PERIOD)
  })
})

describe('pauseWhileDocumentHidden', () => {
  it('disconnects when paused and connects again when resumed', () => {
    const {gate, listener, events} = setupPauseWhileDocumentHidden()
    const subscription = listener.source
      .pipe(gate.pauseWhileDocumentHidden())
      .subscribe((event) => events.push(event))
    expect(listener.state).toEqual({connections: 1, open: 1})

    setVisibility('hidden')
    vi.advanceTimersByTime(LISTENER_PAUSE_GRACE_PERIOD)
    expect(listener.state).toEqual({connections: 1, open: 0})

    setVisibility('visible')
    expect(listener.state).toEqual({connections: 2, open: 1})
    expect(events).toEqual([{type: 'welcome'}, {type: 'welcome'}])

    subscription.unsubscribe()
    expect(listener.state.open).toBe(0)
  })

  it('emits the onPause value when it disconnects', () => {
    const {gate, listener, events} = setupPauseWhileDocumentHidden()
    const subscription = listener.source
      .pipe(gate.pauseWhileDocumentHidden({onPause: () => ({type: 'reconnect' as const})}))
      .subscribe((event) => events.push(event))

    setVisibility('hidden')
    vi.advanceTimersByTime(LISTENER_PAUSE_GRACE_PERIOD)
    setVisibility('visible')

    expect(events).toEqual([{type: 'welcome'}, {type: 'reconnect'}, {type: 'welcome'}])
    subscription.unsubscribe()
  })

  it('emits the onResume value when it connects again, before the events of the new connection', () => {
    const {gate, listener, events} = setupPauseWhileDocumentHidden()
    const subscription = listener.source
      .pipe(gate.pauseWhileDocumentHidden({onResume: () => ({type: 'reconnect' as const})}))
      .subscribe((event) => events.push(event))

    setVisibility('hidden')
    vi.advanceTimersByTime(LISTENER_PAUSE_GRACE_PERIOD)
    expect(events).toEqual([{type: 'welcome'}])

    setVisibility('visible')
    expect(events).toEqual([{type: 'welcome'}, {type: 'reconnect'}, {type: 'welcome'}])
    subscription.unsubscribe()
  })

  it('emits the onResume value when a page hidden from the start is first shown', () => {
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    const {gate, listener, events} = setupPauseWhileDocumentHidden()
    const onResume = vi.fn(() => ({type: 'reconnect' as const}))
    const subscription = listener.source
      .pipe(gate.pauseWhileDocumentHidden({onResume}))
      .subscribe((event) => events.push(event))
    expect(onResume).not.toHaveBeenCalled()

    setVisibility('visible')
    expect(onResume).toHaveBeenCalledTimes(1)
    expect(events).toEqual([{type: 'reconnect'}, {type: 'welcome'}])
    subscription.unsubscribe()
  })

  it('emits the onResume value when a subscription made while paused first connects', () => {
    const {gate, listener, events} = setupPauseWhileDocumentHidden()
    const active = observeActive(gate)
    setVisibility('hidden')
    vi.advanceTimersByTime(LISTENER_PAUSE_GRACE_PERIOD)
    expect(active.latest).toBe(false)

    const subscription = listener.source
      .pipe(gate.pauseWhileDocumentHidden({onResume: () => ({type: 'reconnect' as const})}))
      .subscribe((event) => events.push(event))
    expect(listener.state.connections).toBe(0)

    setVisibility('visible')
    expect(events).toEqual([{type: 'reconnect'}, {type: 'welcome'}])
    subscription.unsubscribe()
    active.unsubscribe()
  })

  it('does not emit the onResume value when a subscription connects right away', () => {
    const {gate, listener, events} = setupPauseWhileDocumentHidden()
    const onResume = vi.fn(() => ({type: 'reconnect' as const}))
    const subscription = listener.source
      .pipe(gate.pauseWhileDocumentHidden({onResume}))
      .subscribe((event) => events.push(event))

    expect(onResume).not.toHaveBeenCalled()
    expect(events).toEqual([{type: 'welcome'}])
    subscription.unsubscribe()
  })

  it('does not connect, or emit the onPause value, on a page hidden from the start', () => {
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    const {gate, listener, events} = setupPauseWhileDocumentHidden()
    const onPause = vi.fn(() => ({type: 'reconnect' as const}))
    const subscription = listener.source
      .pipe(gate.pauseWhileDocumentHidden({onPause}))
      .subscribe((event) => events.push(event))

    expect(listener.state.connections).toBe(0)
    expect(onPause).not.toHaveBeenCalled()

    setVisibility('visible')
    expect(listener.state).toEqual({connections: 1, open: 1})
    expect(events).toEqual([{type: 'welcome'}])
    subscription.unsubscribe()
  })

  it('completes when the source completes, without connecting again', () => {
    const {gate} = setupPauseWhileDocumentHidden()
    const source = new Subject<string>()
    const complete = vi.fn()
    gate.pauseWhileDocumentHidden()(source).subscribe({complete})

    source.complete()
    expect(complete).toHaveBeenCalledTimes(1)
    expect(source.observed).toBe(false)
  })

  it('forwards errors from the source', () => {
    const {gate} = setupPauseWhileDocumentHidden()
    const source = new Subject<string>()
    const error = vi.fn()
    gate.pauseWhileDocumentHidden()(source).subscribe({error})

    source.error(new Error('rejected'))
    expect(error).toHaveBeenCalledWith(new Error('rejected'))
  })
})
