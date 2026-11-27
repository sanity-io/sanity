import {type VisionClosedTab, type VisionTab, type VisionTabOptions} from './types'

/** How long the Restore tabs drawer keeps a closed tab: 30 days from when it was closed */
export const CLOSED_TAB_RETENTION_MS = 30 * 24 * 60 * 60 * 1000

const WHITESPACE = /\s+/g

/** The closed tabs still kept at `now`: one closed `CLOSED_TAB_RETENTION_MS` ago or earlier is purged */
export function keepRecentClosedTabs(
  closedTabs: VisionClosedTab[],
  now: number,
): VisionClosedTab[] {
  return closedTabs.filter(({closedAt}) => now - Date.parse(closedAt) < CLOSED_TAB_RETENTION_MS)
}

/** A tab without a query or params has nothing to restore */
function isBlankTab(tab: VisionTab): boolean {
  return !tab.query.trim() && ['', '{}'].includes(tab.rawParams.replace(WHITESPACE, ''))
}

function hasSameOptions(a: VisionTabOptions, b: VisionTabOptions): boolean {
  const aValues = new Map<string, unknown>(Object.entries(a))
  const bValues = new Map<string, unknown>(Object.entries(b))
  return [...aValues.keys(), ...bValues.keys()].every(
    (key) => aValues.get(key) === bValues.get(key),
  )
}

function hasSameContent(a: VisionTab, b: VisionTab): boolean {
  return (
    a.title === b.title &&
    a.query === b.query &&
    a.rawParams === b.rawParams &&
    a.autoRefetch === b.autoRefetch &&
    a.sharedId === b.sharedId &&
    hasSameOptions(a.options, b.options)
  )
}

/**
 * The closed tabs once `tab` closes at `now`. It comes first, and an entry with the same content
 * gives way to it; a blank tab is not kept. Entries kept for long enough are purged.
 */
export function addClosedTab(
  closedTabs: VisionClosedTab[],
  tab: VisionTab,
  now: number,
): VisionClosedTab[] {
  const kept = keepRecentClosedTabs(closedTabs, now)
  if (isBlankTab(tab)) return kept
  return [
    {tab, closedAt: new Date(now).toISOString()},
    ...kept.filter((closed) => closed.tab.id !== tab.id && !hasSameContent(closed.tab, tab)),
  ]
}
