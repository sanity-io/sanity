import {uuid} from '@sanity/uuid'
import debounce from 'lodash-es/debounce.js'

import {getListenerCounts, subscribeListenerCounts} from './listenerCount'

const TAB_LOCK_PREFIX = 'sanity-listener-tab:'
const TAB_CHANNEL_NAME = 'sanity-studio-tabs'
const TAB_OPENED_MESSAGE = 'opened'
const REPUBLISH_DEBOUNCE_MS = 250
const REPUBLISH_MAX_WAIT_MS = 1000
const UNKNOWN_SCOPE = 'unknown'

/** @internal */
export interface StudioTabLock {
  scope: string
  tabId: string
  count: number
}

const studioTabs: {
  peak: number | undefined
  trackerCount: number
  stopTracking: (() => void) | undefined
  tabId: string | undefined
  publishedCount: number | undefined
  releasePublished: (() => void) | undefined
  publishChain: Promise<void>
} = {
  peak: undefined,
  trackerCount: 0,
  stopTracking: undefined,
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
 * Registers this tab as an open Studio tab until every caller has called the function it returns,
 * publishes its live listener count for other tabs in the same
 * {@link getStudioTabScope | scope} to read, and keeps the peak count of open tabs up to date.
 * Stopping releases the held lock and closes the channel, so an unmounted Studio leaves nothing
 * behind in its host page.
 *
 * @internal
 */
export function startTrackingStudioTabs(scope: string): () => void {
  if (typeof navigator === 'undefined' || navigator.locks === undefined) {
    return () => undefined
  }
  studioTabs.trackerCount += 1
  studioTabs.stopTracking ??= trackStudioTabs(scope)

  let isStopped = false
  return function stopTrackingStudioTabs() {
    if (isStopped) return
    isStopped = true
    studioTabs.trackerCount -= 1
    if (studioTabs.trackerCount === 0) {
      studioTabs.stopTracking?.()
      studioTabs.stopTracking = undefined
    }
  }
}

function trackStudioTabs(scope: string): () => void {
  const session = {isActive: true}

  // The count of open tabs only ever rises when a tab opens, so every tab samples it then.
  const channel = new BroadcastChannel(TAB_CHANNEL_NAME)
  channel.addEventListener('message', (event) => {
    if (event.data === TAB_OPENED_MESSAGE) void sampleOpenTabs()
  })

  void publishListenerCount(scope).then(() => {
    if (session.isActive) {
      void sampleOpenTabs()
      channel.postMessage(TAB_OPENED_MESSAGE)
    }
  })
  const republish = debounce(() => void publishListenerCount(scope), REPUBLISH_DEBOUNCE_MS, {
    maxWait: REPUBLISH_MAX_WAIT_MS,
  })
  const unsubscribe = subscribeListenerCounts(republish)

  return function stopTrackingSession() {
    session.isActive = false
    unsubscribe()
    republish.cancel()
    channel.close()
    // Queued behind any swap in flight, so the lock it takes is the one released.
    studioTabs.publishChain = studioTabs.publishChain.then(releasePublishedLock)
  }
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

  const releaseNext = await holdLock(
    formatStudioTabLock({scope, tabId: getStudioTabId(), count: open}),
  )
  if (releaseNext === undefined) return

  const releasePrevious = studioTabs.releasePublished
  studioTabs.releasePublished = releaseNext
  studioTabs.publishedCount = open
  releasePrevious?.()
}

function releasePublishedLock(): void {
  studioTabs.releasePublished?.()
  studioTabs.releasePublished = undefined
  studioTabs.publishedCount = undefined
}

// The browser releases the lock when the tab closes or crashes, so a held lock is an open tab.
// Resolves `undefined` when the request is rejected (a detached document), so the tab keeps the
// lock it holds and the next count change retries instead of stalling every later republish.
function holdLock(name: string): Promise<(() => void) | undefined> {
  return new Promise((resolveHeld) => {
    navigator.locks
      .request(name, () => new Promise<void>((release) => resolveHeld(release)))
      .catch(() => resolveHeld(undefined))
  })
}

// A sandboxed frame or blocked site data rejects the query, which leaves the peak unknown.
async function sampleOpenTabs(): Promise<void> {
  const snapshot = await navigator.locks.query().catch(() => undefined)
  if (snapshot === undefined) return
  const tabIds = (snapshot.held ?? []).flatMap((lock) => {
    const tabLock = parseStudioTabLock(lock.name ?? '')
    return tabLock ? [tabLock.tabId] : []
  })
  studioTabs.peak = Math.max(studioTabs.peak ?? 0, new Set(tabIds).size)
}
