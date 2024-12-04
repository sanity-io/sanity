import {type MendozaPatch, type TransactionLogEventWithEffects} from '@sanity/types'

import {type DocumentVariantType} from '../../util/getDocumentVariantType'
import {type DocumentRemoteMutationEvent} from '../_legacy'
import {
  type DocumentGroupEvent,
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
      // Find the creation event for this published event
      const creationEvent = events.slice(index + 1).find((e) => isCreateDocumentVersionEvent(e))
      if (creationEvent) {
        // If we found a creation event, we should add it to the publish event
        event.creationEvent = creationEvent
        creationEvent.parentId = event.id
      }
    }
    if (isEditDocumentVersionEvent(event)) {
      // If it's the first edit event after expanding a publish, the id of this event will be shared with the id of the published event, we need to use the following transaction id.
      if (event.parentId === event.id && event.transactions[1]?.revisionId) {
        event.id = event.transactions[1]?.revisionId
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
