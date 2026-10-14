import {afterEach, describe, expect, it, onTestFinished, vi} from 'vitest'

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

/** Runs a few rounds of microtasks, but no task. */
function flushMicrotasks(): Promise<void> {
  let rounds = Promise.resolve()
  for (let round = 0; round < 10; round++) rounds = rounds.then(() => undefined)
  return rounds
}

/**
 * Checks that an `immediate` pacer lets the nodes before its first yield through on a microtask
 * (never synchronously), then yields once, and that the yield holds the node that asked for it
 * and every node after it until the next task.
 */
async function expectYieldToNextTask(pace: Pace, yieldCount: () => number) {
  const batch = Array.from({length: IMMEDIATE_YIELD_EVERY - 1}, () => startNode(pace))
  expect(batch.some((node) => node.ready)).toBe(false)
  await Promise.resolve()
  expect(batch.every((node) => node.ready)).toBe(true)
  expect(yieldCount()).toBe(0)

  const held = [startNode(pace), startNode(pace)]
  expect(yieldCount()).toBe(1)
  await flushMicrotasks()
  expect(held.some((node) => node.ready)).toBe(false)
  await vi.waitFor(() => expect(held.every((node) => node.ready)).toBe(true))
  expect(yieldCount()).toBe(1)
}

/** Records every `MessageChannel` created from here on, and closes them when the test is over. */
function trackMessageChannels() {
  const channels: MessageChannel[] = []
  class TrackedMessageChannel extends MessageChannel {
    constructor() {
      super()
      vi.spyOn(this.port2, 'postMessage')
      channels.push(this)
    }
  }
  vi.stubGlobal('MessageChannel', TrackedMessageChannel)
  // an open port keeps a Node process alive
  onTestFinished(() => channels.forEach((channel) => channel.port1.close()))
  return {
    channels,
    messageCount: () =>
      channels.reduce(
        (count, channel) => count + vi.mocked(channel.port2.postMessage).mock.calls.length,
        0,
      ),
  }
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

  it('yields through setImmediate where there is no scheduler.yield', async () => {
    vi.stubGlobal('scheduler', undefined)
    const requestIdleCallback = vi.fn((): number => 1)
    vi.stubGlobal('window', {requestIdleCallback, cancelIdleCallback: vi.fn()})
    // stands in for Node's, which this package's types do not declare
    const setImmediate = vi.fn((callback: () => void) => setTimeout(callback, 0))
    vi.stubGlobal('setImmediate', setImmediate)
    const {createPace} = await importPace()

    await expectYieldToNextTask(createPace('immediate'), () => setImmediate.mock.calls.length)
    expect(requestIdleCallback).not.toHaveBeenCalled()
  })

  it('yields through a MessageChannel where there is no setImmediate either, as in Safari', async () => {
    vi.stubGlobal('scheduler', undefined)
    vi.stubGlobal('setImmediate', undefined)
    const {messageCount} = trackMessageChannels()
    const {createPace} = await importPace()

    await expectYieldToNextTask(createPace('immediate'), messageCount)
  })

  it('releases every run waiting on the one MessageChannel they share, longest waiting first', async () => {
    vi.stubGlobal('scheduler', undefined)
    vi.stubGlobal('setImmediate', undefined)
    const {channels, messageCount} = trackMessageChannels()
    const {createPace} = await importPace()
    const runs = [createPace('immediate'), createPace('immediate')]

    for (const pace of runs) {
      for (let node = 1; node < IMMEDIATE_YIELD_EVERY; node++) pace().subscribe()
    }
    const released: string[] = []
    runs.forEach((pace, index) => {
      pace().subscribe({complete: () => released.push(`run ${index + 1}`)})
    })

    expect(channels).toHaveLength(1)
    expect(messageCount()).toBe(2)
    await vi.waitFor(() => expect(released).toEqual(['run 1', 'run 2']))
  })

  it('yields through setTimeout where there is no MessageChannel either', async () => {
    vi.stubGlobal('scheduler', undefined)
    vi.stubGlobal('setImmediate', undefined)
    vi.stubGlobal('MessageChannel', undefined)
    const yieldThroughTimeout = vi.fn(setTimeout)
    vi.stubGlobal('setTimeout', yieldThroughTimeout)
    const {createPace} = await importPace()

    await expectYieldToNextTask(
      createPace('immediate'),
      () => yieldThroughTimeout.mock.calls.length,
    )
    expect(yieldThroughTimeout).toHaveBeenCalledWith(expect.any(Function), 0)
  })
})
