import {type MendozaPatch, type TransactionLogEventWithEffects} from '@sanity/types'

import {type ReleasesReducerState} from '../../releases/store/reducer'
import {getReleaseDocumentIdFromReleaseId} from '../../releases/util/getReleaseDocumentIdFromReleaseId'
import {getVersionFromId} from '../../util/draftUtils'
import {type DocumentVariantType} from '../../util/getDocumentVariantType'
import {type DocumentRemoteMutationEvent} from '../_legacy'
import {
  type DocumentGroupEvent,
  type EditDocumentVersionEvent,
  isCreateDocumentVersionEvent,
  isCreateLiveDocumentEvent,
  isDeleteDocumentGroupEvent,
  isDeleteDocumentVersionEvent,
  isEditDocumentVersionEvent,
  isPublishDocumentVersionEvent,
  isScheduleDocumentVersionEvent,
  isUnpublishDocumentEvent,
  isUnscheduleDocumentVersionEvent,
  isUpdateLiveDocumentEvent,
  type UpdateLiveDocumentEvent,
} from './types'

export function removeDupes(
  events: DocumentGroupEvent[],
  newEvents: DocumentGroupEvent[],
): DocumentGroupEvent[] {
  const noDupes = [...events, ...newEvents].reduce((acc, event) => {
    if (acc.has(event.id)) {
      const existingEvent = acc.get(event.id) as DocumentGroupEvent
      if (isEditDocumentVersionEvent(existingEvent) && !isEditDocumentVersionEvent(event)) {
        // Replaces the edit event with the none edit event, the publish event and the last edit event before the publish have the same id.
        acc.set(event.id, event)
      }

      if (existingEvent.type !== event.type) {
        // In the strange case two events got the same id but different types, we need to add a unique key to the map so both events are available
        // This could happen with a document that is created and published with the same revision id, for example in our e2e tests.
        acc.set(`${event.id}-${event.type}`, event)
      }
      return acc
    }
    return acc.set(event.id, event)
  }, new Map<string, DocumentGroupEvent>())
  return Array.from(noDupes.values())
}

export function addEventId(
  event: Omit<DocumentGroupEvent, 'id'>,
  documentVariantType: DocumentVariantType,
): DocumentGroupEvent {
  // this tries to infer the id of the event by checking if we are dealing with a published or version document
  let id = ''
  if (isCreateDocumentVersionEvent(event)) {
    id =
      documentVariantType === 'published'
        ? event.revisionId || `publishCreation--${event.timestamp}`
        : event.versionRevisionId
  } else if (isDeleteDocumentVersionEvent(event)) {
    id =
      documentVariantType === 'published' ? `deleteAt-${event.timestamp}` : event.versionRevisionId
  } else if (isPublishDocumentVersionEvent(event)) {
    id =
      documentVariantType === 'published'
        ? event.revisionId
        : event.versionRevisionId || event.revisionId
  } else if (isUnpublishDocumentEvent(event)) {
    // This event is only available for the published document
    id = documentVariantType === 'published' ? `unpublishAt-${event.timestamp}` : ''
  } else if (isScheduleDocumentVersionEvent(event)) {
    // This event is only available for the version document
    id = documentVariantType === 'published' ? '' : event.versionRevisionId
  } else if (isUnscheduleDocumentVersionEvent(event)) {
    id = documentVariantType === 'published' ? '' : event.versionRevisionId
  } else if (isDeleteDocumentGroupEvent(event)) {
    id = `deleted-${event.timestamp}`
  } else if (isCreateLiveDocumentEvent(event)) {
    id = event.revisionId
  } else if (isUpdateLiveDocumentEvent(event)) {
    id = event.revisionId
  } else if (isEditDocumentVersionEvent(event)) {
    id = event.revisionId
  }
  return {...event, id} as DocumentGroupEvent
}

export function addParentToEvents(events: DocumentGroupEvent[]): DocumentGroupEvent[] {
  const eventsWithParent = JSON.parse(JSON.stringify(events)) as DocumentGroupEvent[]
  eventsWithParent.forEach((event, index) => {
    if (isPublishDocumentVersionEvent(event)) {
      event.documentId = event.versionId
      // Find the creation event and edit events for this published event
      for (let i = index; i < eventsWithParent.length; i++) {
        const nextEvent = eventsWithParent[i]
        if (isEditDocumentVersionEvent(nextEvent)) {
          nextEvent.parentId = event.id
        }
        if (isCreateDocumentVersionEvent(nextEvent)) {
          event.creationEvent = nextEvent
          nextEvent.parentId = event.id
          // When we find the create event we should stop the loop. Events are ordered
          break
        }
      }
    }
    if (isEditDocumentVersionEvent(event)) {
      // If it's the first edit event after expanding a publish, the id of this event will be shared with the id of the published event, we need to use the following transaction id.
      if (event.parentId === event.id && event.transactions[1]?.revisionId) {
        event.id = event.transactions[1].revisionId
      }
    }
  })
  return eventsWithParent
}

const MERGE_WINDOW = 5 * 60 * 1000 // 5 minutes

export function isWithinMergeWindow(a: string, b: string): boolean {
  return Math.abs(Date.parse(a) - Date.parse(b)) < MERGE_WINDOW
}

export function squashLiveEditEvents(events: DocumentGroupEvent[]): DocumentGroupEvent[] {
  return events.reduce((acc: DocumentGroupEvent[], event) => {
    if (isUpdateLiveDocumentEvent(event)) {
      const previousEvent = acc[acc.length - 1]
      // check if the previous event is the same type is within the merge window and same author
      if (
        previousEvent &&
        isUpdateLiveDocumentEvent(previousEvent) &&
        isWithinMergeWindow(previousEvent.timestamp, event.timestamp) &&
        previousEvent.author === event.author
      ) {
        return acc
      }
    }
    acc.push(event)
    return acc
  }, [])
}

export function remoteMutationToTransaction(
  event: DocumentRemoteMutationEvent,
): TransactionLogEventWithEffects {
  return {
    author: event.author,
    documentIDs: [],
    id: event.transactionId,
    timestamp: event.timestamp.toISOString(),
    effects: {
      [event.head._id]: {
        apply: event.effects.apply as MendozaPatch,
        revert: event.effects.revert as MendozaPatch,
      },
    },
  }
}

/**
 * Updates the version publish document id.
 */
export function updateVersionEvents(events: DocumentGroupEvent[]) {
  return events.map((event) => {
    if (isPublishDocumentVersionEvent(event)) {
      return {
        ...event,
        documentId: event.versionId,
      }
    }
    return event
  })
}

/**
 * Adds the release information to the publish event.
 */
export function updatePublishedEvents(
  events: DocumentGroupEvent[],
  releases: ReleasesReducerState,
) {
  return events.map((event) => {
    if (isPublishDocumentVersionEvent(event)) {
      const releaseId = getVersionFromId(event.versionId)
      if (releaseId) {
        const release = releases.releases.get(getReleaseDocumentIdFromReleaseId(releaseId))
        return {...event, release: release}
      }
      return event
    }
    return event
  })
}

export function sortEvents({
  remoteEdits,
  events,
  expandedEvents,
}: {
  remoteEdits: (UpdateLiveDocumentEvent | EditDocumentVersionEvent)[]
  events: DocumentGroupEvent[]
  expandedEvents: EditDocumentVersionEvent[]
}): DocumentGroupEvent[] {
  const eventsWithRemoteEdits = [...remoteEdits, ...events, ...expandedEvents].sort(
    // Sort by timestamp, newest first unless is an edit event that has a corresponding publish event
    (a, b) => {
      if (
        isPublishDocumentVersionEvent(a) &&
        isEditDocumentVersionEvent(b) &&
        a.versionRevisionId === b.revisionId
      ) {
        return -1
      }
      if (
        isPublishDocumentVersionEvent(b) &&
        isEditDocumentVersionEvent(a) &&
        b.versionRevisionId === a.revisionId
      ) {
        return +1
      }

      return Date.parse(b.timestamp) - Date.parse(a.timestamp)
    },
  )
  return eventsWithRemoteEdits
}
