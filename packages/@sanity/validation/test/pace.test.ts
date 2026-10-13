import {afterEach, describe, expect, it, vi} from 'vitest'

import {createYieldingPace, IMMEDIATE_YIELD_EVERY} from '../src/util/pace'

/**
 * `requestIdleCallback` is bound when the module is imported, so the `createPace` tests stub the
 * globals first and import a fresh copy.
 */
async function importPace() {
  vi.resetModules()
  return import('../src/util/pace')
}

/** Subscribes and reports whether the pace completed synchronously (the node may run now). */
function completesNow(pace: () => {subscribe: (observer: {complete: () => void}) => unknown}) {
  let completed = false
  pace().subscribe({
    complete: () => {
      completed = true
    },
  })
  return completed
}

describe('createYieldingPace', () => {
  it('lets a batch of nodes through, then yields once and holds every node until it resolves', async () => {
    let release!: () => void
    const yieldToBrowser = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          release = resolve
        }),
    )
    const pace = createYieldingPace(yieldToBrowser, 3)

    expect(completesNow(pace)).toBe(true)
    expect(completesNow(pace)).toBe(true)
    expect(yieldToBrowser).not.toHaveBeenCalled()

    const third = pace()
    expect(yieldToBrowser).toHaveBeenCalledTimes(1)
    // nodes that arrive while the yield is pending wait for that same yield
    expect(pace()).toBe(third)
    expect(pace()).toBe(third)
    expect(yieldToBrowser).toHaveBeenCalledTimes(1)

    const completions: string[] = []
    third.subscribe({complete: () => completions.push('third')})
    pace().subscribe({complete: () => completions.push('later')})
    expect(completions).toEqual([])

    release()
    await vi.waitFor(() => expect(completions).toEqual(['third', 'later']))

    // the count starts over once the browser hands the thread back
    expect(completesNow(pace)).toBe(true)
    expect(completesNow(pace)).toBe(true)
    pace()
    expect(yieldToBrowser).toHaveBeenCalledTimes(2)
  })

  it('lets the run go on when a yield fails', async () => {
    const pace = createYieldingPace(() => Promise.reject(new Error('aborted')), 1)
    const outcome: string[] = []
    pace().subscribe({
      complete: () => outcome.push('complete'),
      error: () => outcome.push('error'),
    })
    await vi.waitFor(() => expect(outcome).toEqual(['complete']))
  })
})

describe('createPace', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('waits for an idle callback before every node when scheduling is idle', async () => {
    const requestIdleCallback = vi.fn((): number => 1)
    vi.stubGlobal('window', {requestIdleCallback, cancelIdleCallback: vi.fn()})
    const {createPace} = await importPace()
    const pace = createPace('idle')

    pace().subscribe()
    pace().subscribe()
    expect(requestIdleCallback).toHaveBeenCalledTimes(2)
  })

  it('yields through scheduler.yield once every IMMEDIATE_YIELD_EVERY nodes when scheduling is immediate', async () => {
    const scheduler = {yield: vi.fn(() => Promise.resolve())}
    vi.stubGlobal('scheduler', scheduler)
    const {createPace} = await importPace()
    const pace = createPace('immediate')

    for (let node = 1; node < IMMEDIATE_YIELD_EVERY; node++) {
      expect(completesNow(pace)).toBe(true)
    }
    expect(scheduler.yield).not.toHaveBeenCalled()
    expect(completesNow(pace)).toBe(false)
    expect(scheduler.yield).toHaveBeenCalledTimes(1)
  })

  it('never waits in immediate scheduling where the browser has no scheduler.yield', async () => {
    vi.stubGlobal('scheduler', undefined)
    const requestIdleCallback = vi.fn((): number => 1)
    vi.stubGlobal('window', {requestIdleCallback, cancelIdleCallback: vi.fn()})
    const {createPace} = await importPace()
    const pace = createPace('immediate')

    for (let node = 0; node < IMMEDIATE_YIELD_EVERY * 3; node++) {
      expect(completesNow(pace)).toBe(true)
    }
    expect(requestIdleCallback).not.toHaveBeenCalled()
  })
})
