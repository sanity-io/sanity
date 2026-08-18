import {
  type DocumentGroupEvent,
  isDeleteDocumentVersionEvent,
  isEditDocumentVersionEvent,
  isPublishDocumentVersionEvent,
} from './types'

/**
 * Resolves the revision id used for the Review Changes to-document.
 *
 * When `rev` is unset the pane is on the live/current view. A latest publish is
 * that publish event. A latest discard must not use the discarded draft's last
 * edit (discard events are not selectable); return null so the diff uses the
 * live document, which is the published version after a discard.
 */
export function resolveEventsRevisionId({
  rev,
  events,
  loading,
  loadMore,
}: {
  rev?: string | '@lastEdited' | '@lastPublished'
  events: DocumentGroupEvent[]
  loading: boolean
  loadMore: () => void
}): string | null | undefined {
  if (rev === '@lastPublished') {
    const publishEvent = events.find(isPublishDocumentVersionEvent)
    return publishEvent?.id || null
  }
  if (rev === '@lastEdited') {
    const editEvent = events.find(isEditDocumentVersionEvent)
    if (editEvent) return editEvent.revisionId
  }
  if (rev?.startsWith('@release:')) {
    const releaseId = rev.split(':')[1]
    const releaseEvent = events.find(
      (event) => isPublishDocumentVersionEvent(event) && event.releaseId === releaseId,
    )
    if (releaseEvent) return releaseEvent.id
    if (events.length > 0 && !loading) loadMore()
  }

  if (!rev) {
    const [lastEvent] = events

    if (lastEvent) {
      if (isPublishDocumentVersionEvent(lastEvent)) {
        return lastEvent.id
      }
      if (isDeleteDocumentVersionEvent(lastEvent)) {
        return null
      }
    }
  }

  return rev
}
