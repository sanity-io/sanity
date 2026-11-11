import {afterEach, describe, expect, test} from 'vitest'
import {server} from 'vitest/browser'

import type * as ListenerCountExports from './listenerCount'
import type * as ListenerStallExports from './listenerStall'
import type * as StudioTabsExports from './studioTabs'
import {parseStudioTabLock} from './studioTabs'

const STUDIO_TABS_URL = new URL('./studioTabs.ts', import.meta.url).href
const LISTENER_COUNT_URL = new URL('./listenerCount.ts', import.meta.url).href
const LISTENER_STALL_URL = new URL('./listenerStall.ts', import.meta.url).href

interface Tab {
  frame: HTMLIFrameElement
  studioTabs: typeof StudioTabsExports
  listenerCount: typeof ListenerCountExports
  listenerStall: typeof ListenerStallExports
}

type TabWindow = Window & {
  tabModules: Promise<
    [typeof StudioTabsExports, typeof ListenerCountExports, typeof ListenerStallExports]
  >
}

const openFrames: HTMLIFrameElement[] = []

// Each same-origin iframe loads its own copy of the modules, so its stall detector and `pendingRequests`
// state are isolated from every other "tab" in the same test file.
async function openTab(): Promise<Tab> {
  const frame = document.createElement('iframe')
  frame.srcdoc = `<script type="module">window.tabModules = Promise.all([import(${JSON.stringify(STUDIO_TABS_URL)}), import(${JSON.stringify(LISTENER_COUNT_URL)}), import(${JSON.stringify(LISTENER_STALL_URL)})])</script>`
  const loaded = new Promise((resolve) => frame.addEventListener('load', resolve, {once: true}))
  document.body.append(frame)
  openFrames.push(frame)
  await loaded
  const [studioTabs, listenerCount, listenerStall] = await (frame.contentWindow as TabWindow)
    .tabModules
  return {frame, studioTabs, listenerCount, listenerStall}
}

function uniqueHost(): string {
  return `${crypto.randomUUID()}.api.sanity.test`
}

async function isLockStalled(tabId: string): Promise<boolean> {
  const {held = []} = await navigator.locks.query()
  return held.some(
    (lock) => parseStudioTabLock(lock.name ?? '')?.tabId === tabId && lock.name?.endsWith(':s'),
  )
}

afterEach(async () => {
  openFrames.splice(0).forEach((frame) => frame.remove())
})

describe('listener stall detection (real held requests)', () => {
  test(
    'a held request past the trigger stalls once, clears on release, and a later hold is a new occurrence',
    {timeout: 60_000},
    async () => {
      const scope = uniqueHost()
      const tab = await openTab()
      tab.studioTabs.startTrackingStudioTabs(scope)
      const heldUrl = `https://${scope}/v1/data/query`
      const countingFetch = tab.listenerCount.resolveListenerCountingFetch()
      const stalls: unknown[] = []
      tab.listenerStall.subscribeListenerStall((stall) => stalls.push(stall))

      await server.commands.holdRequests(heldUrl)
      void countingFetch(heldUrl)
      void countingFetch(heldUrl)

      await expect.poll(() => stalls.length, {timeout: 20_000, interval: 500}).toBe(1)
      await expect
        .poll(() => isLockStalled(tab.studioTabs.getStudioTabId()), {timeout: 5_000})
        .toBe(true)

      await server.commands.releaseRequests(heldUrl)
      await expect
        .poll(() => isLockStalled(tab.studioTabs.getStudioTabId()), {timeout: 5_000})
        .toBe(false)

      await server.commands.holdRequests(heldUrl)
      void countingFetch(heldUrl)
      await expect.poll(() => stalls.length, {timeout: 20_000, interval: 500}).toBe(2)
      expect(stalls[1]).toMatchObject({stallOccurrence: 2})

      await server.commands.releaseRequests(heldUrl)
    },
  )

  test('holding /users/me produces a boot stall', {timeout: 30_000}, async () => {
    const tab = await openTab()
    const heldUrl = `https://${uniqueHost()}/v1/users/me`
    const countingFetch = tab.listenerCount.resolveListenerCountingFetch()
    const stalls: unknown[] = []
    tab.listenerStall.subscribeListenerStall((stall) => stalls.push(stall))

    await server.commands.holdRequests(heldUrl)
    void countingFetch(heldUrl)

    await expect.poll(() => stalls.length, {timeout: 20_000, interval: 500}).toBe(1)
    expect(stalls[0]).toMatchObject({isBootStall: true})

    await server.commands.releaseRequests(heldUrl)
  })
})
