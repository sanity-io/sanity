import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import type * as ListenerCountExports from './listenerCount'
import type * as StudioTabsExports from './studioTabs'

const SCOPE = 'api.sanity.io'

function createFakeLocks(): {
  locks: LockManager
  held: string[]
  requested: string[]
  events: string[]
} {
  const held: string[] = []
  const requested: string[] = []
  const events: string[] = []
  const locks = {
    request: async (name: string, callback: () => Promise<void>) => {
      requested.push(name)
      await Promise.resolve()
      held.push(name)
      events.push(`acquired ${name}`)
      await callback()
      held.splice(held.indexOf(name), 1)
      events.push(`released ${name}`)
    },
    query: () => Promise.resolve({held: held.map((name) => ({name, mode: 'exclusive'}))}),
  }
  return {locks: locks as unknown as LockManager, held, requested, events}
}

describe('getStudioTabScope', () => {
  it('is the host of the API, port included, and never throws', async () => {
    const {getStudioTabScope} = await import('./studioTabs')

    expect(
      ['https://api.sanity.io', 'http://localhost:3900', 'api.sanity.io', undefined].map(
        getStudioTabScope,
      ),
    ).toEqual(['api.sanity.io', 'localhost:3900', 'unknown', 'unknown'])
  })
})

describe('parseStudioTabLock', () => {
  it('reads the scope, tab id and count, ignoring fields after the count', async () => {
    const {parseStudioTabLock} = await import('./studioTabs')

    expect(parseStudioTabLock('sanity-listener-tab:api.sanity.io:tab-1:4')).toEqual({
      scope: 'api.sanity.io',
      tabId: 'tab-1',
      count: 4,
    })
    expect(parseStudioTabLock('sanity-listener-tab:api.sanity.io:tab-1:4:stalled')).toEqual({
      scope: 'api.sanity.io',
      tabId: 'tab-1',
      count: 4,
    })
  })

  it('round-trips a scope that contains a port', async () => {
    const {parseStudioTabLock} = await import('./studioTabs')

    expect(parseStudioTabLock('sanity-listener-tab:localhost%3A3900:tab-1:2')).toEqual({
      scope: 'localhost:3900',
      tabId: 'tab-1',
      count: 2,
    })
  })

  it('rejects other prefixes and malformed names', async () => {
    const {parseStudioTabLock} = await import('./studioTabs')

    expect(
      [
        'sanity-studio-tab:api.sanity.io:tab-1:4',
        'sanity-listener-tab:api.sanity.io:tab-1:four',
        'sanity-listener-tab:api.sanity.io:tab-1:-1',
        'sanity-listener-tab:api.sanity.io:tab-1:',
        'sanity-listener-tab:api.sanity.io:tab-1',
        'sanity-listener-tab::tab-1:4',
        'sanity-listener-tab:api%E0.sanity.io:tab-1:4',
      ].map(parseStudioTabLock),
    ).toEqual([undefined, undefined, undefined, undefined, undefined, undefined, undefined])
  })
})

describe('studio tab lock', () => {
  let studioTabs: typeof StudioTabsExports
  let listenerCount: typeof ListenerCountExports
  let fakeLocks: ReturnType<typeof createFakeLocks>

  beforeEach(async () => {
    vi.resetModules()
    vi.useFakeTimers()
    fakeLocks = createFakeLocks()
    vi.stubGlobal('navigator', {...navigator, locks: fakeLocks.locks})
    studioTabs = await import('./studioTabs')
    listenerCount = await import('./listenerCount')
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('holds one lock named for its scope, tab id and listener count', async () => {
    studioTabs.startTrackingStudioTabs(SCOPE)
    await vi.runAllTimersAsync()

    expect(fakeLocks.held).toEqual([
      `sanity-listener-tab:${SCOPE}:${studioTabs.getStudioTabId()}:0`,
    ])
    expect(studioTabs.getPeakStudioTabCount()).toBe(1)
  })

  it('republishes once, with the latest count, after changes settle for 250ms', async () => {
    studioTabs.startTrackingStudioTabs(SCOPE)
    await vi.runAllTimersAsync()

    const releases = [1, 2, 3, 4, 5].map(() => listenerCount.openListener())
    releases[0]()
    await vi.advanceTimersByTimeAsync(249)
    expect(fakeLocks.requested).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(1)
    await vi.runAllTimersAsync()

    expect(fakeLocks.requested).toHaveLength(2)
    expect(fakeLocks.held).toEqual([
      `sanity-listener-tab:${SCOPE}:${studioTabs.getStudioTabId()}:4`,
    ])
  })

  it('takes the new lock before releasing the old one', async () => {
    studioTabs.startTrackingStudioTabs(SCOPE)
    await vi.runAllTimersAsync()
    const lockName = (count: number) =>
      `sanity-listener-tab:${SCOPE}:${studioTabs.getStudioTabId()}:${count}`

    listenerCount.openListener()
    await vi.runAllTimersAsync()

    expect(fakeLocks.events).toEqual([
      `acquired ${lockName(0)}`,
      `acquired ${lockName(1)}`,
      `released ${lockName(0)}`,
    ])
  })

  it('skips republishing when the count ends where it started', async () => {
    studioTabs.startTrackingStudioTabs(SCOPE)
    await vi.runAllTimersAsync()

    listenerCount.openListener()()
    await vi.runAllTimersAsync()

    expect(fakeLocks.requested).toHaveLength(1)
  })

  it('counts distinct tab ids, so a swap in progress is not an extra tab', async () => {
    fakeLocks.held.push(
      `sanity-listener-tab:${SCOPE}:other-tab:1`,
      `sanity-listener-tab:${SCOPE}:other-tab:2`,
      'unrelated-lock',
    )

    studioTabs.startTrackingStudioTabs(SCOPE)
    await vi.runAllTimersAsync()

    expect(studioTabs.getPeakStudioTabCount()).toBe(2)
  })

  it('does nothing without Web Locks', async () => {
    vi.resetModules()
    vi.stubGlobal('navigator', {...navigator, locks: undefined})
    const withoutLocks = await import('./studioTabs')

    withoutLocks.startTrackingStudioTabs(SCOPE)
    await vi.runAllTimersAsync()

    expect(withoutLocks.getPeakStudioTabCount()).toBeUndefined()
    expect(fakeLocks.requested).toEqual([])
  })
})
