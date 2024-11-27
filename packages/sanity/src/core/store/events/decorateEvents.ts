import {
  type DocumentGroupEvent,
  isCreateDocumentVersionEvent,
  isPublishDocumentVersionEvent,
} from './types'

/**
 * This function adds additional
 */
export function decorateEvents(events: DocumentGroupEvent[]) {
  events.forEach((event, index) => {
    if (isPublishDocumentVersionEvent(event)) {
      // Find the creation event for this published event
      const creationEvent = events.slice(index + 1).find((e) => isCreateDocumentVersionEvent(e))
      if (creationEvent) {
        // If we found a creation event, we should add it to the publish event
        event.creationEvent = creationEvent
        creationEvent.parentId = event.id
      }
    }
  })
}
