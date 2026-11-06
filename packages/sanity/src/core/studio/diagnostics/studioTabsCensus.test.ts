import {afterEach, describe, expect, it, vi} from 'vitest'

import {
  getStudioTabId,
  requestStudioTabsCensus,
  startStudioTabsCensusResponder,
  type StudioTabActivity,
} from './studioTabsCensus'

function tabActivity(tabId: string, openStreams: number, pending = 0): StudioTabActivity {
  return {
    requests: {
      oldestPendingMs: pending > 0 ? pending * 1000 : undefined,
      openStreams,
      pendingRequests: pending,
      totalStarted: openStreams + pending,
    },
    studioVersion: '6.22.0',
    tabId,
    visibilityState: 'visible',
  }
}

const stopResponders: (() => void)[] = []

afterEach(() => {
  stopResponders.splice(0).forEach((stop) => stop())
  vi.unstubAllGlobals()
})

describe('requestStudioTabsCensus', () => {
  it('adds up the activity of every tab that answers in time', async () => {
    stopResponders.push(
      startStudioTabsCensusResponder(() => tabActivity('other-tab-1', 83)),
      startStudioTabsCensusResponder(() => tabActivity('other-tab-2', 8, 3)),
    )

    const census = await requestStudioTabsCensus({
      currentTab: tabActivity(getStudioTabId(), 6),
      timeoutMs: 100,
    })

    expect(census.status).toBe('success')
    expect(census.totals).toEqual({
      oldestPendingMs: 3000,
      openStreams: 97,
      pendingRequests: 3,
      tabs: 3,
    })
    expect(census.tabs.filter((tab) => tab.currentTab).map((tab) => tab.tabId)).toEqual([
      getStudioTabId(),
    ])
  })

  it("uses the current tab's own snapshot instead of its responder's answer", async () => {
    stopResponders.push(startStudioTabsCensusResponder(() => tabActivity(getStudioTabId(), 999)))

    const census = await requestStudioTabsCensus({
      currentTab: tabActivity(getStudioTabId(), 6),
      timeoutMs: 50,
    })

    expect(census.totals).toMatchObject({openStreams: 6, tabs: 1})
  })

  it('ignores malformed answers from other studio versions', async () => {
    const foreign = new BroadcastChannel('sanity-studio-diagnostics')
    foreign.addEventListener('message', (event: MessageEvent<{requestId?: string}>) => {
      foreign.postMessage({
        requestId: event.data.requestId,
        tab: {tabId: 'old-tab', requests: {openStreams: 'many'}},
        type: 'sanity.studio.diagnostics.census-response',
      })
    })
    stopResponders.push(() => foreign.close())

    const census = await requestStudioTabsCensus({
      currentTab: tabActivity(getStudioTabId(), 2),
      timeoutMs: 50,
    })

    expect(census.totals).toMatchObject({openStreams: 2, tabs: 1})
  })

  it('reports only the current tab when BroadcastChannel is unavailable', async () => {
    vi.stubGlobal('BroadcastChannel', undefined)

    const census = await requestStudioTabsCensus({
      currentTab: tabActivity(getStudioTabId(), 4),
      timeoutMs: 50,
    })

    expect(census).toMatchObject({status: 'unsupported', totals: {openStreams: 4, tabs: 1}})
    expect(startStudioTabsCensusResponder(() => tabActivity('x', 1))).toBeTypeOf('function')
  })
})
