import {afterEach, describe, expect, test} from 'vitest'

import type * as ListenerCountExports from './listenerCount'
import type * as StudioTabsExports from './studioTabs'
import {parseStudioTabLock} from './studioTabs'

const STUDIO_TABS_URL = new URL('./studioTabs.ts', import.meta.url).href
const LISTENER_COUNT_URL = new URL('./listenerCount.ts', import.meta.url).href

interface Tab {
  frame: HTMLIFrameElement
  studioTabs: typeof StudioTabsExports
  listenerCount: typeof ListenerCountExports
}

type TabWindow = Window & {
  tabModules: Promise<[typeof StudioTabsExports, typeof ListenerCountExports]>
}

const openFrames: HTMLIFrameElement[] = []

// Each same-origin iframe loads its own copy of the modules, so it stands for a separate tab
// sharing the origin's lock manager; removing it stands for the tab closing or crashing.
async function openTab(): Promise<Tab> {
  const frame = document.createElement('iframe')
  frame.srcdoc = `<script type="module">window.tabModules = Promise.all([import(${JSON.stringify(STUDIO_TABS_URL)}), import(${JSON.stringify(LISTENER_COUNT_URL)})])</script>`
  const loaded = new Promise((resolve) => frame.addEventListener('load', resolve, {once: true}))
  document.body.append(frame)
  openFrames.push(frame)
  await loaded
  const [studioTabs, listenerCount] = await (frame.contentWindow as TabWindow).tabModules
  return {frame, studioTabs, listenerCount}
}

function uniqueScope(): string {
  return `${crypto.randomUUID()}.api.sanity.test`
}

async function heldTabLocks(scope: string) {
  const {held = []} = await navigator.locks.query()
  return held.flatMap((lock) => {
    const tabLock = parseStudioTabLock(lock.name ?? '')
    return tabLock?.scope === scope ? [tabLock] : []
  })
}

async function heldLockNames(scope: string): Promise<string[]> {
  const tabLocks = await heldTabLocks(scope)
  return tabLocks.map(({tabId, count}) => `${tabId}:${count}`).sort()
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function heldTabLockCount(): Promise<number> {
  const {held = []} = await navigator.locks.query()
  return held.filter((lock) => parseStudioTabLock(lock.name ?? '')).length
}

// A removed frame's locks are released asynchronously, and every test's peak counts tabs across
// all scopes, so each test starts only once the previous test's tabs are gone.
afterEach(async () => {
  openFrames.splice(0).forEach((frame) => frame.remove())
  await expect.poll(heldTabLockCount).toBe(0)
})

describe('studio tab locks (real Web Locks)', () => {
  test("a tab's lock carries its scope, tab id and current listener count", async () => {
    const scope = uniqueScope()
    const tab = await openTab()

    tab.studioTabs.startTrackingStudioTabs(scope)
    tab.listenerCount.openListener()
    tab.listenerCount.openListener()

    await expect.poll(() => heldLockNames(scope)).toEqual([`${tab.studioTabs.getStudioTabId()}:2`])
  })

  test('a count change settles on exactly one lock per tab with the new count', async () => {
    const scope = uniqueScope()
    const tabs = await Promise.all([openTab(), openTab()])
    tabs.forEach((tab) => tab.studioTabs.startTrackingStudioTabs(scope))
    await expect.poll(async () => (await heldTabLocks(scope)).length).toBe(2)

    const releases = tabs.map((tab) => tab.listenerCount.openListener())
    tabs[0].listenerCount.openListener()
    releases[1]()

    await expect
      .poll(() => heldLockNames(scope))
      .toEqual(
        [
          `${tabs[0].studioTabs.getStudioTabId()}:2`,
          `${tabs[1].studioTabs.getStudioTabId()}:0`,
        ].sort(),
      )
  })

  test('a tab is never missing from query() while it republishes', async () => {
    const scope = uniqueScope()
    const tab = await openTab()
    const tabId = tab.studioTabs.getStudioTabId()
    tab.studioTabs.startTrackingStudioTabs(scope)
    await expect.poll(async () => (await heldTabLocks(scope)).length).toBe(1)

    const churn = Array.from({length: 6}).reduce<Promise<void>>(async (previous) => {
      await previous
      const release = tab.listenerCount.openListener()
      await delay(260)
      release()
      await delay(260)
    }, Promise.resolve())
    const observations = await Promise.all(
      Array.from({length: 500}, async (_, index) => {
        await delay(index * 6)
        return heldTabLocks(scope)
      }),
    )
    await churn

    const tabIdsSeen = observations.map((tabLocks) => new Set(tabLocks.map((lock) => lock.tabId)))
    const countsSeen = new Set(observations.flat().map((lock) => lock.count))
    expect(tabIdsSeen.every((tabIds) => tabIds.size === 1 && tabIds.has(tabId))).toBe(true)
    expect([...countsSeen].sort((first, second) => first - second)).toEqual([0, 1])
  })

  test('closing a tab drops its lock', async () => {
    const scope = uniqueScope()
    const tab = await openTab()
    tab.studioTabs.startTrackingStudioTabs(scope)
    await expect.poll(async () => (await heldTabLocks(scope)).length).toBe(1)

    tab.frame.remove()

    await expect.poll(() => heldTabLocks(scope)).toEqual([])
  })

  test('six tabs starting together each see six, and seven once another opens', async () => {
    const scope = uniqueScope()
    const tabs = await Promise.all(Array.from({length: 6}, () => openTab()))

    tabs.forEach((tab) => tab.studioTabs.startTrackingStudioTabs(scope))
    tabs.forEach((tab) => tab.listenerCount.openListener())

    await expect
      .poll(() => tabs.map((tab) => tab.studioTabs.getPeakStudioTabCount()))
      .toEqual([6, 6, 6, 6, 6, 6])
    await delay(400)
    const lateTab = await openTab()
    lateTab.studioTabs.startTrackingStudioTabs(scope)
    await expect.poll(() => lateTab.studioTabs.getPeakStudioTabCount()).toBe(7)
    await expect
      .poll(() => tabs.map((tab) => tab.studioTabs.getPeakStudioTabCount()))
      .toEqual([7, 7, 7, 7, 7, 7])
  })

  test('an open tab resamples when another tab opens', async () => {
    const scope = uniqueScope()
    const firstTab = await openTab()
    firstTab.studioTabs.startTrackingStudioTabs(scope)
    await expect.poll(() => firstTab.studioTabs.getPeakStudioTabCount()).toBe(1)

    const secondTab = await openTab()
    secondTab.studioTabs.startTrackingStudioTabs(scope)

    await expect.poll(() => firstTab.studioTabs.getPeakStudioTabCount()).toBe(2)
  })
})
