import {
  type DocumentGroupEvent,
  isCreateDocumentVersionEvent,
  isEditDocumentVersionEvent,
} from 'sanity'

/** How many transactions of an edit group are shown when it is expanded. */
export const INITIAL_TRANSACTIONS = 10
/** How many more transactions each "Show more" reveals. */
export const MORE_TRANSACTIONS = 20

export interface TimelineEventRow {
  type: 'event'
  event: DocumentGroupEvent
  /** How many expanded events this row is nested under. */
  depth: number
}

/** Follows the last shown transaction of an edit group that has more of them. */
export interface TimelineShowMoreRow {
  type: 'showMore'
  /** The id of the edit group. */
  parentId: string
  depth: number
}

export type TimelineRow = TimelineEventRow | TimelineShowMoreRow

function getParentId(event: DocumentGroupEvent): string | undefined {
  return isEditDocumentVersionEvent(event) || isCreateDocumentVersionEvent(event)
    ? event.parentId
    : undefined
}

/**
 * Whether the event lists one of the transactions of a grouped edit event, see
 * `addEditTransactionEvents` in the events store.
 */
export function isEditTransactionEvent(event: DocumentGroupEvent): boolean {
  return isEditDocumentVersionEvent(event) && Boolean(event.isTransaction)
}

/** How many transactions are listed under each grouped edit event, by the id of the group. */
export function getTransactionCounts(events: DocumentGroupEvent[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const event of events) {
    const parentId = getParentId(event)
    if (parentId && isEditTransactionEvent(event)) {
      counts.set(parentId, (counts.get(parentId) ?? 0) + 1)
    }
  }
  return counts
}

/**
 * How many transactions to show for each edit group so the selected one is shown: when it is past
 * the first {@link INITIAL_TRANSACTIONS}, as many as "Show more" would have revealed to reach it.
 */
export function getInitialRevealedTransactions(
  events: DocumentGroupEvent[],
  selectedEventId: string | undefined,
): Map<string, number> {
  const selected = events.find((event) => event.id === selectedEventId)
  const parentId = selected && isEditTransactionEvent(selected) ? getParentId(selected) : undefined
  if (!parentId) return new Map()

  const index = events
    .filter((event) => isEditTransactionEvent(event) && getParentId(event) === parentId)
    .indexOf(selected!)
  if (index < INITIAL_TRANSACTIONS) return new Map()
  const steps = Math.ceil((index + 1 - INITIAL_TRANSACTIONS) / MORE_TRANSACTIONS)
  return new Map([[parentId, INITIAL_TRANSACTIONS + steps * MORE_TRANSACTIONS]])
}

/**
 * The row to highlight for the selected event. The newest transaction listed under an edit group
 * shares its id with the group (they are the same revision), so the most nested row with that id
 * is the one highlighted: the transaction when the group is expanded, the group otherwise.
 */
export function getSelectedRowIndex(
  rows: TimelineRow[],
  selectedEventId: string | undefined,
): number {
  return rows.findLastIndex((row) => row.type === 'event' && row.event.id === selectedEventId)
}

/** The ids of the events the event with `eventId` is nested under, closest first. */
export function getAncestorIds(
  events: DocumentGroupEvent[],
  eventId: string | undefined,
): string[] {
  const eventsById = new Map<string, DocumentGroupEvent>()
  for (const event of events) {
    if (!eventsById.has(event.id)) eventsById.set(event.id, event)
  }
  const ancestorIds: string[] = []
  const event = eventId ? eventsById.get(eventId) : undefined
  let parentId = event ? getParentId(event) : undefined
  while (parentId && !ancestorIds.includes(parentId)) {
    ancestorIds.push(parentId)
    const parent = eventsById.get(parentId)
    parentId = parent ? getParentId(parent) : undefined
  }
  return ancestorIds
}

/**
 * The rows the timeline renders for `events` (newest first, every nested event after the event
 * it is nested under):
 * - An event without a parent, or whose parent isn't in the list (e.g. the From list starts
 *   after it), is a top-level row.
 * - A nested event is shown when its parent is expanded and shown, one level deeper.
 * - Only the first transactions of an edit group are shown, as many as `revealedTransactions`
 *   holds for it ({@link INITIAL_TRANSACTIONS} by default), followed by a "Show more" row when it
 *   has more.
 * - Known quirk kept from before: a creation event nested under a publish is shown at the top
 *   level when it is the last event in the list, even if the publish is collapsed.
 */
export function getTimelineRows({
  events,
  expandedParents,
  revealedTransactions = new Map(),
}: {
  events: DocumentGroupEvent[]
  expandedParents: ReadonlySet<string>
  revealedTransactions?: ReadonlyMap<string, number>
}): TimelineRow[] {
  // A listed transaction is never a parent, and the newest one shares its id with its group (or
  // the publish), so it must not count as that parent being in the list.
  const eventIds = new Set(
    events.filter((event) => !isEditTransactionEvent(event)).map((event) => event.id),
  )
  const lastEventId = events.at(-1)?.id
  const transactionCounts = getTransactionCounts(events)
  const shownDepths = new Map<string, number>()
  const shownTransactions = new Map<string, number>()
  const rows: TimelineRow[] = []

  for (const event of events) {
    const parentId = getParentId(event)
    let depth: number | undefined
    if (!parentId || !eventIds.has(parentId)) {
      depth = 0
    } else if (isCreateDocumentVersionEvent(event) && event.id === lastEventId) {
      depth = 0
    } else if (expandedParents.has(parentId) && shownDepths.has(parentId)) {
      depth = shownDepths.get(parentId)! + 1
    }
    if (depth === undefined) continue

    if (parentId && isEditTransactionEvent(event)) {
      const index = shownTransactions.get(parentId) ?? 0
      const revealed = revealedTransactions.get(parentId) ?? INITIAL_TRANSACTIONS
      if (index >= revealed) continue
      shownTransactions.set(parentId, index + 1)
      rows.push({type: 'event', event, depth})
      if (index === revealed - 1 && (transactionCounts.get(parentId) ?? 0) > revealed) {
        rows.push({type: 'showMore', parentId, depth})
      }
      continue
    }

    if (!shownDepths.has(event.id)) shownDepths.set(event.id, depth)
    rows.push({type: 'event', event, depth})
  }
  return rows
}
