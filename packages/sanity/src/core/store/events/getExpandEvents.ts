import {type SanityClient} from '@sanity/client'
import {BehaviorSubject, map} from 'rxjs'

import {getDocumentTransactions} from './getDocumentTransactions'
import {getEditEvents} from './getEditEvents'
import {
  type DocumentGroupEvent,
  type EditDocumentVersionEvent,
  isPublishDocumentVersionEvent,
} from './types'

export function getExpandEvents({documentId, client}: {client: SanityClient; documentId: string}) {
  const expandedEventsMap$ = new BehaviorSubject<Map<string, EditDocumentVersionEvent[]>>(new Map())
  const expandedEvents$ = expandedEventsMap$.pipe(
    map((expandedEventsMap) => Array.from(expandedEventsMap.values()).flatMap((v) => v)),
  )

  const handleExpandEvent = async (event: DocumentGroupEvent) => {
    if (expandedEventsMap$.getValue().has(event.id)) {
      return // Already expanded
    }
    if (isPublishDocumentVersionEvent(event) && event.versionRevisionId && event.creationEvent) {
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
