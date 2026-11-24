import {
  type DocumentGroupEvent,
  isCreateDocumentVersionEvent,
  isEditDocumentVersionEvent,
} from 'sanity'

export interface TimelineEventRow {
  type: 'event'
  event: DocumentGroupEvent
  /** How many expanded events this row is nested under. */
  depth: number
}

export type TimelineRow = TimelineEventRow

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
 * - Known quirk kept from before: a creation event nested under a publish is shown at the top
 *   level when it is the last event in the list, even if the publish is collapsed.
 */
export function getTimelineRows({
  events,
  expandedParents,
}: {
  events: DocumentGroupEvent[]
  expandedParents: ReadonlySet<string>
}): TimelineRow[] {
  const eventIds = new Set(events.map((event) => event.id))
  const lastEventId = events.at(-1)?.id
  const shownDepths = new Map<string, number>()
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

    if (!shownDepths.has(event.id)) shownDepths.set(event.id, depth)
    rows.push({type: 'event', event, depth})
  }
  return rows
}
