import {afterEach, describe, expect, test} from 'vitest'

import type * as ListenerCountExports from './listenerCount'
import type * as ListenerLedgerExports from './listenerLedger'
import type * as StudioTabsExports from './studioTabs'

const STUDIO_TABS_URL = new URL('./studioTabs.ts', import.meta.url).href
const LISTENER_COUNT_URL = new URL('./listenerCount.ts', import.meta.url).href
const LISTENER_LEDGER_URL = new URL('./listenerLedger.ts', import.meta.url).href

interface Tab {
  frame: HTMLIFrameElement
  studioTabs: typeof StudioTabsExports
  listenerCount: typeof ListenerCountExports
  listenerLedger: typeof ListenerLedgerExports
}

type TabWindow = Window & {
  tabModules: Promise<
    [typeof StudioTabsExports, typeof ListenerCountExports, typeof ListenerLedgerExports]
  >
}

const openFrames: HTMLIFrameElement[] = []
const heldRawLocks: (() => void)[] = []

// Each same-origin iframe loads its own copy of the modules, so it stands for a separate tab
// sharing the origin's lock manager; removing it stands for the tab closing or crashing.
async function openTab(): Promise<Tab> {
  const frame = document.createElement('iframe')
  frame.srcdoc = `<script type="module">window.tabModules = Promise.all([import(${JSON.stringify(STUDIO_TABS_URL)}), import(${JSON.stringify(LISTENER_COUNT_URL)}), import(${JSON.stringify(LISTENER_LEDGER_URL)})])</script>`
  const loaded = new Promise((resolve) => frame.addEventListener('load', resolve, {once: true}))
  document.body.append(frame)
  openFrames.push(frame)
  await loaded
  const [studioTabs, listenerCount, listenerLedger] = await (frame.contentWindow as TabWindow)
    .tabModules
  return {frame, studioTabs, listenerCount, listenerLedger}
}

function uniqueScope(): string {
  return `${crypto.randomUUID()}.api.sanity.test`
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Stands in for another tab's lock without going through `setStalled` (c5), so this commit's
// snapshot reading can be tested on its own.
async function holdRawLock(name: string): Promise<void> {
  const held = new Promise<void>((resolveHeld) => {
    navigator.locks
      .request(
        name,
        () =>
          new Promise<void>((release) => {
            heldRawLocks.push(release)
            resolveHeld()
          }),
      )
      .catch(() => undefined)
  })
  await held
}

async function heldTabLockCount(): Promise<number> {
  const {held = []} = await navigator.locks.query()
  return held.filter((lock) => lock.name?.startsWith('sanity-listener-tab:')).length
}

afterEach(async () => {
  heldRawLocks.splice(0).forEach((release) => release())
  openFrames.splice(0).forEach((frame) => frame.remove())
  await expect.poll(heldTabLockCount).toBe(0)
})

describe('listener ledger snapshot (real Web Locks)', () => {
  test('a burst of 6 tabs gives the exact total', async () => {
    const scope = uniqueScope()
    const tabs = await Promise.all(Array.from({length: 6}, () => openTab()))
    tabs.forEach((tab) => tab.studioTabs.startTrackingStudioTabs(scope))
    tabs.forEach((tab, index) => {
      Array.from({length: index + 1}).forEach(() => tab.listenerCount.openListener(scope))
    })

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

  test('a count republished in a tight loop never makes a snapshot miss or double-count the tab', async () => {
    const scope = uniqueScope()
    const watcher = await openTab()
    const churning = await openTab()
    watcher.studioTabs.startTrackingStudioTabs(scope)
    churning.studioTabs.startTrackingStudioTabs(scope)
    await expect
      .poll(async () => (await watcher.listenerLedger.snapshot(scope))?.liveTabCount)
      .toBe(2)

    const churn = Array.from({length: 6}).reduce<Promise<void>>(async (previous) => {
      await previous
      const release = churning.listenerCount.openListener(scope)
      await delay(260)
      release()
      await delay(260)
    }, Promise.resolve())

    const observations = await Promise.all(
      Array.from({length: 200}, async (_, index) => {
        await delay(index * 15)
        return watcher.listenerLedger.snapshot(scope)
      }),
    )
    await churn

    expect(observations.every((snapshotTaken) => snapshotTaken?.liveTabCount === 2)).toBe(true)
  })

  test('a tab in another scope counts 0', async () => {
    const scope = uniqueScope()
    const otherScope = uniqueScope()
    const watcher = await openTab()
    const otherScopeTab = await openTab()
    watcher.studioTabs.startTrackingStudioTabs(scope)
    otherScopeTab.studioTabs.startTrackingStudioTabs(otherScope)
    otherScopeTab.listenerCount.openListener(otherScope)
    await expect
      .poll(async () => (await otherScopeTab.listenerLedger.snapshot(otherScope))?.self?.count)
      .toBe(1)

    const snapshotTaken = await watcher.listenerLedger.snapshot(scope)
    expect(snapshotTaken?.liveTabCount).toBe(1)
    expect(snapshotTaken?.others).toEqual([])
    expect(snapshotTaken?.total).toBe(0)
  })

  test(':s on a held lock reads as a stalled tab', async () => {
    const scope = uniqueScope()
    const watcher = await openTab()
    watcher.studioTabs.startTrackingStudioTabs(scope)
    await expect
      .poll(async () => (await watcher.listenerLedger.snapshot(scope))?.liveTabCount)
      .toBe(1)

    await holdRawLock(`sanity-listener-tab:${encodeURIComponent(scope)}:other-tab:3:s`)

    const snapshotTaken = await watcher.listenerLedger.snapshot(scope)
    expect(snapshotTaken?.others).toEqual([{tabId: 'other-tab', count: 3, isStalled: true}])
    expect(snapshotTaken?.stalledOtherTabCount).toBe(1)
  })
})
