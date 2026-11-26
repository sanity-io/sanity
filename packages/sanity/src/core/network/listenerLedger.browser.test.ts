import {afterEach, describe, expect, test, vi} from 'vitest'
import {server} from 'vitest/browser'

import type * as ListenerCountExports from './listenerCount'
import type * as ListenerLedgerExports from './listenerLedger'
import type * as ListenerStallExports from './listenerStall'
import type * as StudioTabsExports from './studioTabs'

const STUDIO_TABS_URL = new URL('./studioTabs.ts', import.meta.url).href
const LISTENER_COUNT_URL = new URL('./listenerCount.ts', import.meta.url).href
const LISTENER_LEDGER_URL = new URL('./listenerLedger.ts', import.meta.url).href
const LISTENER_STALL_URL = new URL('./listenerStall.ts', import.meta.url).href

interface Tab {
  frame: HTMLIFrameElement
  studioTabs: typeof StudioTabsExports
  listenerCount: typeof ListenerCountExports
  listenerLedger: typeof ListenerLedgerExports
  listenerStall: typeof ListenerStallExports
}

type TabWindow = Window & {
  tabModules: Promise<
    [
      typeof StudioTabsExports,
      typeof ListenerCountExports,
      typeof ListenerLedgerExports,
      typeof ListenerStallExports,
    ]
  >
}

const openFrames: HTMLIFrameElement[] = []

// Each same-origin iframe loads its own copy of the modules, so it stands for a separate tab
// sharing the origin's lock manager; removing it stands for the tab closing or crashing.
async function openTab(): Promise<Tab> {
  const frame = document.createElement('iframe')
  frame.srcdoc = `<script type="module">window.tabModules = Promise.all([import(${JSON.stringify(STUDIO_TABS_URL)}), import(${JSON.stringify(LISTENER_COUNT_URL)}), import(${JSON.stringify(LISTENER_LEDGER_URL)}), import(${JSON.stringify(LISTENER_STALL_URL)})])</script>`
  const loaded = new Promise((resolve) => frame.addEventListener('load', resolve, {once: true}))
  document.body.append(frame)
  openFrames.push(frame)
  await loaded
  const [studioTabs, listenerCount, listenerLedger, listenerStall] = await (
    frame.contentWindow as TabWindow
  ).tabModules
  return {frame, studioTabs, listenerCount, listenerLedger, listenerStall}
}

function uniqueScope(): string {
  return `${crypto.randomUUID()}.api.sanity.test`
}

async function heldTabLockCount(): Promise<number> {
  const {held = []} = await navigator.locks.query()
  return held.filter((lock) => lock.name?.startsWith('sanity-listener-tab:')).length
}

afterEach(async () => {
  openFrames.splice(0).forEach((frame) => frame.remove())
  await expect.poll(heldTabLockCount).toBe(0)
})

describe('listener ledger snapshot (real Web Locks)', () => {
  test('a burst of 6 tabs gives the exact total, ignoring a tab in another scope', async () => {
    const scope = uniqueScope()
    const otherScope = uniqueScope()
    const tabs = await Promise.all(Array.from({length: 6}, () => openTab()))
    tabs.forEach((tab) => tab.studioTabs.startTrackingStudioTabs(scope))
    tabs.forEach((tab, index) => {
      Array.from({length: index + 1}).forEach(() => tab.listenerCount.openListener(scope))
    })
    const otherScopeTab = await openTab()
    otherScopeTab.studioTabs.startTrackingStudioTabs(otherScope)
    otherScopeTab.listenerCount.openListener(otherScope)
    await expect
      .poll(async () => (await otherScopeTab.listenerLedger.snapshot(otherScope))?.self?.count)
      .toBe(1)

    await expect
      .poll(async () => (await tabs[0].listenerLedger.snapshot(scope))?.total)
      .toBe(1 + 2 + 3 + 4 + 5 + 6)

    const snapshotFromFirstTab = await tabs[0].listenerLedger.snapshot(scope)
    expect(snapshotFromFirstTab?.liveTabCount).toBe(6)
    expect(snapshotFromFirstTab?.self?.count).toBe(1)
    expect(snapshotFromFirstTab?.othersTotal).toBe(2 + 3 + 4 + 5 + 6)
  })

  test('a removed iframe is gone from the next snapshot, including 0-1ms after a simulated crash', async () => {
    const scope = uniqueScope()
    const watcher = await openTab()
    const other = await openTab()
    watcher.studioTabs.startTrackingStudioTabs(scope)
    other.studioTabs.startTrackingStudioTabs(scope)
    other.listenerCount.openListener(scope)

    await expect
      .poll(async () => (await watcher.listenerLedger.snapshot(scope))?.liveTabCount)
      .toBe(2)

    other.frame.remove()
    openFrames.splice(openFrames.indexOf(other.frame), 1)

    const snapshotAfterCrash = await watcher.listenerLedger.snapshot(scope)
    expect(snapshotAfterCrash?.liveTabCount).toBe(1)
    expect(snapshotAfterCrash?.others).toEqual([])
  })

  test(
    'a tab with a held request reads as stalled to another tab until the request is released',
    {timeout: 30_000},
    async () => {
      const scope = uniqueScope()
      const watcher = await openTab()
      const stalling = await openTab()
      watcher.studioTabs.startTrackingStudioTabs(scope)
      stalling.studioTabs.startTrackingStudioTabs(scope)
      const heldUrl = `https://${scope}/v1/data/query`
      const stalls: unknown[] = []
      stalling.listenerStall.subscribeListenerStall((stall) => stalls.push(stall))

      await server.commands.holdRequests(heldUrl)
      void stalling.listenerCount.resolveListenerCountingFetch()(heldUrl)

      await expect.poll(() => stalls.length, {timeout: 20_000, interval: 500}).toBe(1)
      await expect
        .poll(async () => (await watcher.listenerLedger.snapshot(scope))?.stalledOtherTabCount)
        .toBe(1)

      await server.commands.releaseRequests(heldUrl)
      await expect
        .poll(async () => (await watcher.listenerLedger.snapshot(scope))?.stalledOtherTabCount)
        .toBe(0)
    },
  )

  test('a rejected lock query reads as unmeasured', async () => {
    const tab = await openTab()
    const tabLocks = (tab.frame.contentWindow as Window).navigator.locks
    const querySpy = vi
      .spyOn(tabLocks, 'query')
      .mockRejectedValue(new DOMException('Site data is blocked', 'SecurityError'))

    await expect(tab.listenerLedger.snapshot(uniqueScope())).resolves.toBeUndefined()

    querySpy.mockRestore()
  })
})
