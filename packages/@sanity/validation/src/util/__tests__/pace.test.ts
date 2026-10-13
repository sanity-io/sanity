import {afterEach, describe, expect, it, vi} from 'vitest'

import {createYieldingPace, IMMEDIATE_YIELD_EVERY, type Pace} from '../pace'

/**
 * `requestIdleCallback` is bound when the module is imported, so the `createPace` tests stub the
 * globals first and import a fresh copy.
 */
async function importPace() {
  vi.resetModules()
  return import('../pace')
}

/** Starts a node: subscribes to what it waits for, and tracks whether it may run yet. */
function startNode(pace: Pace) {
  const node = {ready: false}
  pace().subscribe({
    complete: () => {
      node.ready = true
    },
  })
  return node
}

describe('createYieldingPace', () => {
  it('lets nodes through on a microtask, then yields once and holds every node until it resolves', async () => {
    let release!: () => void
    const yieldToBrowser = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          release = resolve
        }),
    )
    const pace = createYieldingPace(yieldToBrowser, 3)

    const batch = [startNode(pace), startNode(pace)]
    // never synchronously, so that every node starts on a fresh call stack
    expect(batch.map((node) => node.ready)).toEqual([false, false])
    await Promise.resolve()
    expect(batch.map((node) => node.ready)).toEqual([true, true])
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
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(completions).toEqual([])

    release()
    await vi.waitFor(() => expect(completions).toEqual(['third', 'later']))

    // the count starts over once the browser hands the thread back
    const nextBatch = [startNode(pace), startNode(pace)]
    await Promise.resolve()
    expect(nextBatch.map((node) => node.ready)).toEqual([true, true])
    expect(yieldToBrowser).toHaveBeenCalledTimes(1)
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

    const batch = Array.from({length: IMMEDIATE_YIELD_EVERY - 1}, () => startNode(pace))
    expect(batch.some((node) => node.ready)).toBe(false)
    await Promise.resolve()
    expect(batch.every((node) => node.ready)).toBe(true)
    expect(scheduler.yield).not.toHaveBeenCalled()

    const yielding = startNode(pace)
    expect(scheduler.yield).toHaveBeenCalledTimes(1)
    await vi.waitFor(() => expect(yielding.ready).toBe(true))
  })

  it('only defers every node to a microtask in immediate scheduling where the browser has no scheduler.yield', async () => {
    vi.stubGlobal('scheduler', undefined)
    const requestIdleCallback = vi.fn((): number => 1)
    vi.stubGlobal('window', {requestIdleCallback, cancelIdleCallback: vi.fn()})
    const {createPace} = await importPace()
    const pace = createPace('immediate')

    const nodes = Array.from({length: IMMEDIATE_YIELD_EVERY * 3}, () => startNode(pace))
    expect(nodes.some((node) => node.ready)).toBe(false)
    await Promise.resolve()
    expect(nodes.every((node) => node.ready)).toBe(true)
    expect(requestIdleCallback).not.toHaveBeenCalled()
  })
})
