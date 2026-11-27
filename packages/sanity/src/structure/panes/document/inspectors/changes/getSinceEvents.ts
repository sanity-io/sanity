import {type DocumentGroupEvent, isEditDocumentVersionEvent} from 'sanity'

/**
 * The events the "From" menu offers for the selected "To" event: the ones older than it.
 *
 * The events nested under an event that comes before the "To" event (e.g. its siblings) have no
 * parent to expand in this list; the timeline shows them at the top level. The transactions
 * listed under the "To" event are part of it, so they can't be compared with it.
 */
export function getSinceEvents(
  events: DocumentGroupEvent[],
  toEvent: DocumentGroupEvent | null,
): DocumentGroupEvent[] {
  if (!toEvent) return events.slice(1)
  return events
    .slice(events.indexOf(toEvent) + 1)
    .filter(
      (event) =>
        !(
          isEditDocumentVersionEvent(event) &&
          event.isTransaction &&
          event.parentId === toEvent.id
        ),
    )
}
