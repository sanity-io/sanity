import {BehaviorSubject} from 'rxjs'
import {afterEach, describe, expect, it, onTestFinished, vi} from 'vitest'

import {
  createYieldingPace,
  IMMEDIATE_YIELD_EVERY,
  type Pace,
  type ValidationScheduling,
} from '../pace'

/**
 * `requestIdleCallback` is bound when the module is imported, so the `createPace` tests stub the
 * globals first and import a fresh copy.
 */
async function importPace() {
  vi.resetModules()
  return import('../pace')
}

function immediateScheduling() {
  return new BehaviorSubject<ValidationScheduling>('immediate')
}

/** Starts a node and tracks whether its pacing wait has completed. */
function startNode(pace: Pace) {
  const node = {ready: false}
  void pace.wait()?.then(() => {
    node.ready = true
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

    const third = pace.wait()
    expect(yieldToBrowser).toHaveBeenCalledTimes(1)
    // nodes that arrive while the yield is pending wait for that same yield
    expect(pace.wait()).toBe(third)
    expect(pace.wait()).toBe(third)
    expect(yieldToBrowser).toHaveBeenCalledTimes(1)

    const completions: string[] = []
    void third?.then(() => completions.push('third'))
    void pace.wait()?.then(() => completions.push('later'))
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(completions).toEqual([])

    release()
    await vi.waitFor(() => expect(completions).toEqual(['third', 'later']))

    // the count starts over once the browser hands the thread back
    const nextBatch = [startNode(pace), startNode(pace)]
    await Promise.resolve()
    expect(nextBatch.map((node) => node.ready)).toEqual([true, true])
    expect(yieldToBrowser).toHaveBeenCalledTimes(1)
    void pace.wait()
    expect(yieldToBrowser).toHaveBeenCalledTimes(2)
  })

  it('lets the run go on when a yield fails', async () => {
    const pace = createYieldingPace(() => Promise.reject(new Error('aborted')), 1)
    await expect(pace.wait()).resolves.toBeUndefined()
  })

  it('cancels a node waiting for a browser yield', async () => {
    const pace = createYieldingPace(() => new Promise<void>(() => undefined), 1)
    const controller = new AbortController()
    const reason = new Error('cancelled')
    const pending = pace.wait(controller.signal)

    controller.abort(reason)

    await expect(pending).rejects.toBe(reason)
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
    const pace = createPace()

    void pace.wait()
    void pace.wait()
    expect(requestIdleCallback).toHaveBeenCalledTimes(2)
  })

  it('yields through scheduler.yield once every IMMEDIATE_YIELD_EVERY nodes when scheduling is immediate', async () => {
    const scheduler = {yield: vi.fn(() => Promise.resolve())}
    vi.stubGlobal('scheduler', scheduler)
    const {createPace} = await importPace()
    const pace = createPace(immediateScheduling())

    const batch = Array.from({length: IMMEDIATE_YIELD_EVERY - 1}, () => startNode(pace))
    expect(batch.some((node) => node.ready)).toBe(false)
    await Promise.resolve()
    expect(batch.every((node) => node.ready)).toBe(true)
    expect(scheduler.yield).not.toHaveBeenCalled()

    const yielding = startNode(pace)
    expect(scheduler.yield).toHaveBeenCalledTimes(1)
    await vi.waitFor(() => expect(yielding.ready).toBe(true))
  })

  it('lets the nodes waiting for idle time go ahead when a changing scheduling switches to immediate', async () => {
    let nextHandle = 1
    const requestIdleCallback = vi.fn((): number => nextHandle++)
    const cancelIdleCallback = vi.fn()
    vi.stubGlobal('window', {requestIdleCallback, cancelIdleCallback})
    vi.stubGlobal('scheduler', {yield: vi.fn(() => Promise.resolve())})
    const {createPace} = await importPace()
    const scheduling = new BehaviorSubject<ValidationScheduling>('idle')
    const pace = createPace(scheduling)

    const waiting = [startNode(pace), startNode(pace)]
    expect(requestIdleCallback).toHaveBeenCalledTimes(2)
    expect(waiting.some((node) => node.ready)).toBe(false)

    scheduling.next('immediate')
    await Promise.resolve()
    expect(waiting.every((node) => node.ready)).toBe(true)
    expect(cancelIdleCallback.mock.calls).toEqual([[1], [2]])

    // nodes that come along after the switch get the `immediate` pace: a microtask, no idle time
    const later = startNode(pace)
    expect(later.ready).toBe(false)
    await Promise.resolve()
    expect(later.ready).toBe(true)
    expect(requestIdleCallback).toHaveBeenCalledTimes(2)
  })

  it('waits for idle time again once a changing scheduling is back to idle', async () => {
    const requestIdleCallback = vi.fn((): number => 1)
    vi.stubGlobal('window', {requestIdleCallback, cancelIdleCallback: vi.fn()})
    vi.stubGlobal('scheduler', {yield: vi.fn(() => Promise.resolve())})
    const {createPace} = await importPace()
    const scheduling = new BehaviorSubject<ValidationScheduling>('immediate')
    const pace = createPace(scheduling)

    startNode(pace)
    expect(requestIdleCallback).not.toHaveBeenCalled()

    scheduling.next('idle')
    const node = startNode(pace)
    expect(requestIdleCallback).toHaveBeenCalledTimes(1)
    await flushMicrotasks()
    expect(node.ready).toBe(false)
  })

  it('yields through setImmediate where there is no scheduler.yield', async () => {
    vi.stubGlobal('scheduler', undefined)
    const requestIdleCallback = vi.fn((): number => 1)
    vi.stubGlobal('window', {requestIdleCallback, cancelIdleCallback: vi.fn()})
    // stands in for Node's, which this package's types do not declare
    const setImmediate = vi.fn((callback: () => void) => setTimeout(callback, 0))
    vi.stubGlobal('setImmediate', setImmediate)
    const {createPace} = await importPace()

    await expectYieldToNextTask(
      createPace(immediateScheduling()),
      () => setImmediate.mock.calls.length,
    )
    expect(requestIdleCallback).not.toHaveBeenCalled()
  })

  it('yields through a MessageChannel where there is no setImmediate either, as in Safari', async () => {
    vi.stubGlobal('scheduler', undefined)
    vi.stubGlobal('setImmediate', undefined)
    const {messageCount} = trackMessageChannels()
    const {createPace} = await importPace()

    await expectYieldToNextTask(createPace(immediateScheduling()), messageCount)
  })

  it('releases every run waiting on the one MessageChannel they share, longest waiting first', async () => {
    vi.stubGlobal('scheduler', undefined)
    vi.stubGlobal('setImmediate', undefined)
    const {channels, messageCount} = trackMessageChannels()
    const {createPace} = await importPace()
    const runs = [createPace(immediateScheduling()), createPace(immediateScheduling())]

    for (const pace of runs) {
      for (let node = 1; node < IMMEDIATE_YIELD_EVERY; node++) void pace.wait()
    }
    const released: string[] = []
    runs.forEach((pace, index) => {
      void pace.wait()?.then(() => released.push(`run ${index + 1}`))
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
      createPace(immediateScheduling()),
      () => yieldThroughTimeout.mock.calls.length,
    )
    expect(yieldThroughTimeout).toHaveBeenCalledWith(expect.any(Function), 0)
  })
})
