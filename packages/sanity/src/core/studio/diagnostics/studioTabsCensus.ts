import {type RequestActivitySnapshot} from './requestActivity'

/**
 * Studio tabs in the same browser share one connection (and its ~100 request budget) to the
 * Sanity API, but no web API exposes what other tabs have open. Instead, every Studio tab answers
 * a broadcast "census" request with its own request activity, and the asking tab adds up the
 * answers that arrive within a short window.
 *
 * Only tabs on the same origin, in the same browser profile, running a Studio version with this
 * responder can answer. Frozen or discarded background tabs don't answer either.
 */

const CHANNEL_NAME = 'sanity-studio-diagnostics'
const CENSUS_REQUEST = 'sanity.studio.diagnostics.census-request'
const CENSUS_RESPONSE = 'sanity.studio.diagnostics.census-response'

const DEFAULT_TABS_CENSUS_TIMEOUT = 1000

/** @internal */
export interface StudioTabActivity {
  requests: Pick<
    RequestActivitySnapshot,
    'oldestPendingMs' | 'openStreams' | 'pendingRequests' | 'totalStarted'
  >
  studioVersion: string
  tabId: string
  visibilityState?: string
}

/** @internal */
export interface StudioTabsCensus {
  status: 'success' | 'unsupported'
  tabs: (StudioTabActivity & {currentTab: boolean})[]
  totals: {
    oldestPendingMs?: number
    openStreams: number
    pendingRequests: number
    tabs: number
  }
  /** How long the census waited for other tabs to answer */
  waitedMs: number
}

interface CensusRequest {
  requestId: string
  type: typeof CENSUS_REQUEST
}

interface CensusResponse {
  requestId: string
  tab: StudioTabActivity
  type: typeof CENSUS_RESPONSE
}

const TAB_ID = createId()

/**
 * Identifies this browser tab (page load) in census answers.
 *
 * @internal
 */
export function getStudioTabId(): string {
  return TAB_ID
}

/**
 * Describes this tab's request activity for a census answer.
 *
 * @internal
 */
export function createStudioTabActivity(
  snapshot: RequestActivitySnapshot,
  studioVersion: string,
): StudioTabActivity {
  return {
    requests: {
      oldestPendingMs: snapshot.oldestPendingMs,
      openStreams: snapshot.openStreams,
      pendingRequests: snapshot.pendingRequests,
      totalStarted: snapshot.totalStarted,
    },
    studioVersion,
    tabId: TAB_ID,
    visibilityState: typeof document === 'undefined' ? undefined : document.visibilityState,
  }
}

/**
 * Answers census requests from other Studio tabs with this tab's activity. Cheap while idle: it
 * only does work when another tab asks.
 *
 * @returns A function that stops answering
 * @internal
 */
export function startStudioTabsCensusResponder(getActivity: () => StudioTabActivity): () => void {
  if (typeof BroadcastChannel === 'undefined') return () => undefined

  const channel = new BroadcastChannel(CHANNEL_NAME)
  channel.addEventListener('message', (event: MessageEvent<unknown>) => {
    if (!isCensusRequest(event.data)) return

    const response: CensusResponse = {
      requestId: event.data.requestId,
      tab: getActivity(),
      type: CENSUS_RESPONSE,
    }
    channel.postMessage(response)
  })

  return () => channel.close()
}

/**
 * Asks every Studio tab in this browser for its request activity, waits `timeoutMs` for answers,
 * and adds them up together with the current tab's activity.
 *
 * @internal
 */
export function requestStudioTabsCensus({
  currentTab,
  timeoutMs = DEFAULT_TABS_CENSUS_TIMEOUT,
}: {
  currentTab: StudioTabActivity
  timeoutMs?: number
}): Promise<StudioTabsCensus> {
  if (typeof BroadcastChannel === 'undefined') {
    return Promise.resolve(summarize('unsupported', 0, currentTab, []))
  }

  const startedAt = performance.now()
  const requestId = createId()
  const channel = new BroadcastChannel(CHANNEL_NAME)
  const otherTabs = new Map<string, StudioTabActivity>()

  channel.addEventListener('message', (event: MessageEvent<unknown>) => {
    if (!isCensusResponse(event.data) || event.data.requestId !== requestId) return

    const {tab} = event.data
    // The current tab's own responder answers too: use the fresher local snapshot instead
    if (tab.tabId === currentTab.tabId || otherTabs.has(tab.tabId)) return
    otherTabs.set(tab.tabId, tab)
  })

  const request: CensusRequest = {requestId, type: CENSUS_REQUEST}
  channel.postMessage(request)

  return new Promise((resolve) => {
    setTimeout(() => {
      channel.close()
      resolve(
        summarize('success', Math.round(performance.now() - startedAt), currentTab, [
          ...otherTabs.values(),
        ]),
      )
    }, timeoutMs)
  })
}

function summarize(
  status: StudioTabsCensus['status'],
  waitedMs: number,
  currentTab: StudioTabActivity,
  otherTabs: StudioTabActivity[],
): StudioTabsCensus {
  const tabs = [
    {...currentTab, currentTab: true},
    ...otherTabs.map((tab) => ({...tab, currentTab: false})),
  ]
  const oldestPending = tabs
    .map((tab) => tab.requests.oldestPendingMs)
    .filter((value): value is number => typeof value === 'number')

  return {
    status,
    tabs,
    totals: {
      oldestPendingMs: oldestPending.length > 0 ? Math.max(...oldestPending) : undefined,
      openStreams: sum(tabs.map((tab) => tab.requests.openStreams)),
      pendingRequests: sum(tabs.map((tab) => tab.requests.pendingRequests)),
      tabs: tabs.length,
    },
    waitedMs,
  }
}

function isCensusRequest(value: unknown): value is CensusRequest {
  return isRecord(value) && value.type === CENSUS_REQUEST && typeof value.requestId === 'string'
}

function isCensusResponse(value: unknown): value is CensusResponse {
  return (
    isRecord(value) &&
    value.type === CENSUS_RESPONSE &&
    typeof value.requestId === 'string' &&
    isTabActivity(value.tab)
  )
}

// Answers can come from other Studio versions, so check the shape before trusting it
function isTabActivity(value: unknown): value is StudioTabActivity {
  if (!isRecord(value) || !isRecord(value.requests)) return false

  const {requests} = value
  return (
    typeof value.tabId === 'string' &&
    typeof value.studioVersion === 'string' &&
    (value.visibilityState === undefined || typeof value.visibilityState === 'string') &&
    typeof requests.openStreams === 'number' &&
    typeof requests.pendingRequests === 'number' &&
    typeof requests.totalStarted === 'number' &&
    (requests.oldestPendingMs === undefined || typeof requests.oldestPendingMs === 'number')
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}
