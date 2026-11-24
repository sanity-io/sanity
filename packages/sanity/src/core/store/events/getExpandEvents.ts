import {type SanityClient} from '@sanity/client'
import {BehaviorSubject, map} from 'rxjs'

import {getDocumentTransactions} from './getDocumentTransactions'
import {type FrozenEditGroups, getEditEvents} from './getEditEvents'
import {
  type CreateDocumentVersionEvent,
  type DeleteDocumentVersionEvent,
  type DocumentGroupEvent,
  type EditDocumentVersionEvent,
  isDeleteDocumentVersionEvent,
  isEditDocumentVersionEvent,
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
 * into the list of edit events that led up to it, and keeping an expanded edit event as it is.
 *
 * `handleExpandEvent(event)`:
 * - Grouped edit events list their transactions on their own already (`addEditTransactionEvents`),
 *   so expanding one fetches nothing: its transactions are added to `frozenEditGroups$`, which
 *   keeps them grouped together (and nothing else grouped with them) while new edits arrive, so
 *   the group keeps its id. Only top-level edit events are frozen; the ones nested under an
 *   expanded publish are history that new edits can't regroup.
 * - Otherwise, only events matching {@link isExpandableEvent} can be expanded; anything else logs
 *   an error and is ignored.
 * - Fetches the transactions between the creation revision and the published/deleted revision,
 *   maps them to edit events (`getEditEvents`) and stamps each with `parentId: event.id` so the UI
 *   can nest them under the expanded event.
 * - Expanding the same event twice is a no-op (results are kept in a map keyed by event id).
 * - Known quirk: the returned promise is not error-handled by callers and `getDocumentTransactions`
 *   failures surface as unhandled rejections (tracked as a known issue).
 *
 * `expandedEvents$` emits the flattened list of all expanded edit events, and `frozenEditGroups$`
 * the expanded edit groups; both are consumed by `createEventsObservable`. Edit groups stay frozen
 * for the lifetime of the store, also when the UI collapses them: unfreezing would regroup them
 * with newer edits, and the list would move under the user.
 */
export function getExpandEvents({documentId, client}: {client: SanityClient; documentId: string}) {
  const expandedEventsMap$ = new BehaviorSubject<Map<string, EditDocumentVersionEvent[]>>(new Map())
  const expandedEvents$ = expandedEventsMap$.pipe(
    map((expandedEventsMap) => Array.from(expandedEventsMap.values()).flatMap((v) => v)),
  )
  const frozenEditGroups$ = new BehaviorSubject<FrozenEditGroups>(new Map())

  const freezeEditGroup = (event: EditDocumentVersionEvent) => {
    if (event.parentId || event.isTransaction) return
    const frozenEditGroups = frozenEditGroups$.getValue()
    if (event.transactions.every((transaction) => frozenEditGroups.has(transaction.revisionId))) {
      return // Already frozen
    }
    const next = new Map(frozenEditGroups)
    for (const transaction of event.transactions) {
      next.set(transaction.revisionId, event.id)
    }
    frozenEditGroups$.next(next)
  }

  const handleExpandEvent = async (event: DocumentGroupEvent) => {
    if (isEditDocumentVersionEvent(event)) {
      freezeEditGroup(event)
      return
    }
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
      const editEvents = getEditEvents(transactions, documentId).map((editEvent) => ({
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

  return {handleExpandEvent, expandedEvents$, frozenEditGroups$: frozenEditGroups$.asObservable()}
}
