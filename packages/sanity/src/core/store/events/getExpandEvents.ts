import {type SanityClient} from '@sanity/client'
import {BehaviorSubject, map} from 'rxjs'

import {getDocumentTransactions} from './getDocumentTransactions'
import {getEditEvents} from './getEditEvents'
import {
  type CreateDocumentVersionEvent,
  type DeleteDocumentVersionEvent,
  type DocumentGroupEvent,
  type EditDocumentVersionEvent,
  isDeleteDocumentVersionEvent,
  isPublishDocumentVersionEvent,
  type PublishDocumentVersionEvent,
} from './types'

/**
 * Whether an event can be expanded into the edit events that led up to it: only
 * `publishDocumentVersion` / `deleteDocumentVersion` events that carry both a
 * `versionRevisionId` and a `creationEvent` (the creation event is attached by
 * `addParentToEvents` for drafts).
 */
export function isExpandableEvent(event: DocumentGroupEvent): event is (
  | PublishDocumentVersionEvent
  | DeleteDocumentVersionEvent
) & {
  versionRevisionId: string
  creationEvent: CreateDocumentVersionEvent
} {
  return (
    (isPublishDocumentVersionEvent(event) || isDeleteDocumentVersionEvent(event)) &&
    Boolean(event.versionRevisionId) &&
    Boolean(event.creationEvent)
  )
}

/**
 * Provides the "expand event" capability of the events store: turning a publish or delete event
 * into the list of edit events that led up to it.
 *
 * `handleExpandEvent(event)`:
 * - Only events matching {@link isExpandableEvent} can be expanded; anything else logs an error
 *   and is ignored.
 * - Fetches the transactions between the creation revision and the published/deleted revision,
 *   maps them to edit events (`getEditEvents`) and stamps each with `parentId: event.id` so the UI
 *   can nest them under the expanded event.
 * - Expanding the same event twice is a no-op (results are kept in a map keyed by event id).
 * - Known quirk: the returned promise is not error-handled by callers and `getDocumentTransactions`
 *   failures surface as unhandled rejections (tracked as a known issue).
 *
 * `expandedEvents$` emits the flattened list of all expanded edit events, consumed by
 * `createEventsObservable` to merge them into the main list.
 */
export function getExpandEvents({documentId, client}: {client: SanityClient; documentId: string}) {
  const expandedEventsMap$ = new BehaviorSubject<Map<string, EditDocumentVersionEvent[]>>(new Map())
  const expandedEvents$ = expandedEventsMap$.pipe(
    map((expandedEventsMap) => Array.from(expandedEventsMap.values()).flatMap((v) => v)),
  )

  const handleExpandEvent = async (event: DocumentGroupEvent) => {
    if (expandedEventsMap$.getValue().has(event.id)) {
      return // Already expanded
    }
    if (isExpandableEvent(event)) {
      // This are the only events we can expand.
      // We need to get that creation event and use versionRevisionId and fetch the transactions that occurred
      // Since since the creation to the publish.
      const transactions = await getDocumentTransactions({
        client,
        documentId,
        fromTransaction: event.creationEvent.versionRevisionId,
        toTransaction: event.versionRevisionId,
      })
      const editEvents = getEditEvents(transactions, documentId, false).map((editEvent) => ({
        ...editEvent,
        parentId: event.id,
      }))

      const value = expandedEventsMap$.getValue()
      value.set(event.id, editEvents)
      expandedEventsMap$.next(value)
    } else {
      console.error("This event can't be expanded", event)
    }
  }

  return {handleExpandEvent, expandedEvents$}
}
