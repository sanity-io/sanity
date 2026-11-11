import {hostMatchesScope} from './listenerCount'
import {getStudioTabId, parseStudioTabLock} from './studioTabs'

const STALLED_SUFFIX = ':s'
const OLD_TAB_LOCK_PREFIX = 'sanity-studio-tab:'

/** @internal */
export interface LedgerTab {
  tabId: string
  count: number
  isStalled: boolean
}

/** @internal */
export interface LedgerSnapshot {
  self: LedgerTab | undefined
  others: LedgerTab[]
  othersTotal: number
  total: number
  liveTabCount: number
  unknownTabCount: number
  stalledOtherTabCount: number
}

/**
 * A point-in-time read of every Studio tab's published listener count in `scope`, from the
 * presence locks {@link startTrackingStudioTabs} publishes. `undefined` where the browser has no
 * Web Locks to read, in which case the classifier reports `unmeasured`.
 *
 * @internal
 */
export async function snapshot(scope: string): Promise<LedgerSnapshot | undefined> {
  if (typeof navigator === 'undefined' || navigator.locks === undefined) {
    return undefined
  }

  const {held = []} = await navigator.locks.query()
  const tabsByTabId = latestEntryPerTab(
    held.flatMap((lock) => entryForLock(lock.name ?? '', scope)),
  )
  const selfTabId = getStudioTabId()
  const self = tabsByTabId.get(selfTabId)
  const others = Array.from(tabsByTabId.values()).filter((tab) => tab.tabId !== selfTabId)
  const othersTotal = sumCounts(others)

  return {
    self,
    others,
    othersTotal,
    total: othersTotal + (self?.count ?? 0),
    liveTabCount: tabsByTabId.size,
    unknownTabCount: held.filter((lock) => lock.name?.startsWith(OLD_TAB_LOCK_PREFIX)).length,
    stalledOtherTabCount: others.filter((tab) => tab.isStalled).length,
  }
}

function entryForLock(lockName: string, scope: string): LedgerTab[] {
  const tabLock = parseStudioTabLock(lockName)
  if (!tabLock || !hostMatchesScope(scope, tabLock.scope)) return []
  return [
    {tabId: tabLock.tabId, count: tabLock.count, isStalled: lockName.endsWith(STALLED_SUFFIX)},
  ]
}

// Both of a tab's lock names are briefly held while it swaps (the overlap rule in
// `studioTabs.ts`), so dedupe by keeping the higher count.
function latestEntryPerTab(entries: LedgerTab[]): Map<string, LedgerTab> {
  return entries.reduce((byTabId, entry) => {
    const current = byTabId.get(entry.tabId)
    return current === undefined || entry.count > current.count
      ? byTabId.set(entry.tabId, entry)
      : byTabId
  }, new Map<string, LedgerTab>())
}

function sumCounts(tabs: LedgerTab[]): number {
  return tabs.reduce((total, tab) => total + tab.count, 0)
}
