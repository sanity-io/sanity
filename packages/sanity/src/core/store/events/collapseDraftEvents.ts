import {
  type DocumentGroupEvent,
  isCreateDocumentVersionEvent,
  isPublishDocumentVersionEvent,
} from './types'

export function collapseDraftEvents(
  events: DocumentGroupEvent[],
  nextCursor: string | undefined,
): DocumentGroupEvent[] {
  /**
   * When inspecting the draft we need to remove from the view the "creation" events that are not the first one.
   * A draft could have multiple lives, so it wil be initially created (we want to show that one) and then edited and published.
   * When publishing, the draft is removed, so it will be created again on the first edit that the draft has, this new creation event should be removed.
   * We are gonna remove them by squashing them into the publish event if that draft was published, otherwise we will add it to the first edit event that came after creation.
   * */
  const collapsedEvents: DocumentGroupEvent[] = []

  events.forEach((event, index) => {
    if (isCreateDocumentVersionEvent(event)) {
      const isFirstCreationEvent =
        // If next cursor is present, this creation event can't be the first one.
        nextCursor
          ? false
          : // If it's not present, check if it's the last event
            index === events.length - 1
      if (!isFirstCreationEvent) {
        // If it's not the first creation event, we add it to the previousEvent if it's a published event
        const previousEvent = collapsedEvents[collapsedEvents.length - 1]
        if (isPublishDocumentVersionEvent(previousEvent)) {
          // If the last event is a publish event, we add the creation event to the publish event
          previousEvent.creationEvent = event
          return
        }
      }
      // If the last event is not a publish event, we add the creation event to the previousEvent
      //   previousEvent.creationEvents.push(event)
    }
    collapsedEvents.push(event)
  })

  return collapsedEvents
}
