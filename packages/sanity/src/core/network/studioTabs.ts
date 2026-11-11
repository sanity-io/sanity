import {uuid} from '@sanity/uuid'
import debounce from 'lodash-es/debounce.js'

import {getListenerCounts, subscribeListenerCounts} from './listenerCount'

const TAB_LOCK_PREFIX = 'sanity-listener-tab:'
const TAB_CHANNEL_NAME = 'sanity-studio-tabs'
const TAB_OPENED_MESSAGE = 'opened'
const REPUBLISH_DEBOUNCE_MS = 250
const UNKNOWN_SCOPE = 'unknown'

/** @internal */
export interface StudioTabLock {
  scope: string
  tabId: string
  count: number
}

const studioTabs: {
  peak: number | undefined
  isTracking: boolean
  tabId: string | undefined
  publishedCount: number | undefined
  releasePublished: (() => void) | undefined
  publishChain: Promise<void>
} = {
  peak: undefined,
  isTracking: false,
  tabId: undefined,
  publishedCount: undefined,
  releasePublished: undefined,
  publishChain: Promise.resolve(),
}

/**
 * The most Studio tabs this tab has seen open at once on this origin, itself included, or
 * `undefined` where the browser cannot tell (no Web Locks outside a secure context).
 *
 * @internal
 */
export function getPeakStudioTabCount(): number | undefined {
  return studioTabs.peak
}

/**
 * An id for this tab, stable for the life of the page.
 *
 * @internal
 */
export function getStudioTabId(): string {
  studioTabs.tabId ??= uuid()
  return studioTabs.tabId
}

/**
 * The scope tabs share listener capacity in: the host of the client's root `apiHost`, since the
 * browser pools every `<projectId>.<apiHost>` onto one connection.
 *
 * @internal
 */
export function getStudioTabScope(apiHost: string | undefined): string {
  try {
    return new URL(apiHost ?? '').host
  } catch {
    return UNKNOWN_SCOPE
  }
}

/**
 * Reads a tab lock name written by {@link startTrackingStudioTabs}, or `undefined` for any other
 * lock. Fields after the count are ignored.
 *
 * @internal
 */
export function parseStudioTabLock(name: string): StudioTabLock | undefined {
  const [encodedScope = '', tabId, count = ''] = name.startsWith(TAB_LOCK_PREFIX)
    ? name.slice(TAB_LOCK_PREFIX.length).split(':')
    : []
  const scope = decodeScope(encodedScope)
  return scope && tabId && /^\d+$/.test(count) ? {scope, tabId, count: Number(count)} : undefined
}

function decodeScope(encodedScope: string): string | undefined {
  try {
    return decodeURIComponent(encodedScope)
  } catch {
    return undefined
  }
}

function formatStudioTabLock({scope, tabId, count}: StudioTabLock): string {
  return `${TAB_LOCK_PREFIX}${encodeURIComponent(scope)}:${tabId}:${count}`
}

/**
 * Registers this tab as an open Studio tab for as long as the page lives, publishes its live
 * listener count for other tabs in the same {@link getStudioTabScope | scope} to read, and keeps
 * the peak count of open tabs up to date. Safe to call more than once.
 *
 * @internal
 */
export function startTrackingStudioTabs(scope: string): void {
  if (studioTabs.isTracking || typeof navigator === 'undefined' || navigator.locks === undefined) {
    return
  }
  studioTabs.isTracking = true

  // The count of open tabs only ever rises when a tab opens, so every tab samples it then.
  const channel = new BroadcastChannel(TAB_CHANNEL_NAME)
  channel.addEventListener('message', (event) => {
    if (event.data === TAB_OPENED_MESSAGE) void sampleOpenTabs()
  })

  void publishListenerCount(scope).then(() => {
    void sampleOpenTabs()
    channel.postMessage(TAB_OPENED_MESSAGE)
  })
  subscribeListenerCounts(debounce(() => void publishListenerCount(scope), REPUBLISH_DEBOUNCE_MS))
}

function publishListenerCount(scope: string): Promise<void> {
  studioTabs.publishChain = studioTabs.publishChain.then(() => replaceTabLock(scope))
  return studioTabs.publishChain
}

// The new name is held before the old one is released, so the tab is never missing from
// `navigator.locks.query()`; readers dedupe the brief overlap by tab id.
async function replaceTabLock(scope: string): Promise<void> {
  const {open} = getListenerCounts()
  if (studioTabs.publishedCount === open) return

  const releasePrevious = studioTabs.releasePublished
  studioTabs.releasePublished = await holdLock(
    formatStudioTabLock({scope, tabId: getStudioTabId(), count: open}),
  )
  studioTabs.publishedCount = open
  releasePrevious?.()
}

// The browser releases the lock when the tab closes or crashes, so a held lock is an open tab.
function holdLock(name: string): Promise<() => void> {
  return new Promise((resolveHeld) => {
    void navigator.locks.request(name, () => new Promise<void>((release) => resolveHeld(release)))
  })
}

async function sampleOpenTabs(): Promise<void> {
  const {held = []} = await navigator.locks.query()
  const tabIds = held.flatMap((lock) => {
    const tabLock = parseStudioTabLock(lock.name ?? '')
    return tabLock ? [tabLock.tabId] : []
  })
  studioTabs.peak = Math.max(studioTabs.peak ?? 0, new Set(tabIds).size)
}
