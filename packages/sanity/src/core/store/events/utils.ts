import {type MendozaPatch, type TransactionLogEventWithEffects} from '@sanity/types'

import {type ReleasesReducerState} from '../../releases/store/reducer'
import {getReleaseDocumentIdFromReleaseId} from '../../releases/util/getReleaseDocumentIdFromReleaseId'
import {getVersionFromId} from '../../util/draftUtils'
import {type DocumentVariantType} from '../../util/getDocumentVariantType'
import {type DocumentRemoteMutationEvent} from '../document/buffered-doc/types'
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

/**
 * Merges two event lists (existing first, then incoming) into one, removing duplicates by event id.
 *
 * Main cases covered:
 * - Events with unseen ids are appended in encounter order.
 * - If an existing *edit* event shares its id with an incoming *non-edit* event, the non-edit event
 *   replaces it — a publish event and the last edit before that publish share the same id.
 * - If two events share an id but have *different* types, both are kept: the second one is stored
 *   under a synthetic `${id}-${type}` map key (can happen when a document is created and published
 *   with the same revision id, e.g. in e2e tests).
 *
 * Known quirks (current behavior, relied upon by tests):
 * - Events with an empty-string id (see {@link addEventId}) all collide on the same map key, so
 *   only the first one survives unless their types differ.
 * - The synthetic `${id}-${type}` key only disambiguates one extra event per id; a third event
 *   with the same id and same type as the second overwrites it.
 */
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

/**
 * Assigns a client-side `id` to an API event. The id doubles as the *revision selector* used in
 * URLs and by `getDocumentAtRevision`, so it must point at a revision that exists for the variant
 * the user is looking at:
 *
 * - `createDocumentVersion`: published → `revisionId` (or a synthetic `publishCreation--<ts>` when
 *   missing); draft/version → `versionRevisionId`.
 * - `deleteDocumentVersion`: published → synthetic `deleteAt-<ts>`; draft/version → `versionRevisionId`.
 * - `publishDocumentVersion`: published → `revisionId`; draft/version → `versionRevisionId`
 *   (falls back to `revisionId` when the publish wasn't triggered by a Publish action).
 * - `unpublishDocument`: published → synthetic `unpublishAt-<ts>`; **empty string otherwise**.
 * - `scheduleDocumentVersion` / `unscheduleDocumentVersion`: draft/version → `versionRevisionId`;
 *   **empty string on published**.
 * - `deleteDocumentGroup`: synthetic `deleted-<ts>` for all variants.
 * - `createLiveDocument` / `updateLiveDocument` / `editDocumentVersion`: `revisionId`.
 *
 * Known quirk: the empty-string ids collide in {@link removeDupes} (only the first such event
 * survives) and cannot be selected as a revision in the UI.
 */
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

/**
 * Draft-variant post-processing: links publish/delete events to the edit and create events that
 * produced them, so the UI can render those as an expandable group under the publish event.
 *
 * For every `publishDocumentVersion` / `deleteDocumentVersion` event (scanning newest → oldest):
 * - Rewrites its `documentId` to the `versionId` (the draft id).
 * - Walks the *older* events: every `editDocumentVersion` on the way gets `parentId` set to the
 *   publish/delete event id; the first `createDocumentVersion` found is attached as
 *   `creationEvent` (and gets `parentId` too), then the walk stops.
 *
 * For `editDocumentVersion` events whose id equals their own `parentId` (the last edit before a
 * publish shares the publish event's id), the id is re-pointed at the second transaction's
 * revision so the edit remains individually selectable.
 *
 * Notes on current behavior:
 * - Operates on a `JSON.parse(JSON.stringify(...))` deep clone (runs on every pipeline emission
 *   for drafts — known perf cost, tracked as a known issue).
 * - Assumes `events` is sorted newest-first (as produced by {@link sortEvents}).
 */
export function addParentToEvents(events: DocumentGroupEvent[]): DocumentGroupEvent[] {
  const eventsWithParent = JSON.parse(JSON.stringify(events)) as DocumentGroupEvent[]
  eventsWithParent.forEach((event, index) => {
    if (isPublishDocumentVersionEvent(event) || isDeleteDocumentVersionEvent(event)) {
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

/**
 * True when two ISO timestamps are less than 5 minutes apart (absolute difference).
 * Used to decide whether consecutive edit transactions belong to the same logical edit event.
 */
export function isWithinMergeWindow(a: string, b: string): boolean {
  return Math.abs(Date.parse(a) - Date.parse(b)) < MERGE_WINDOW
}

/**
 * Collapses consecutive `updateLiveDocument` events into one when they are within the merge
 * window **and** by the same author — the later (newer) event in the list survives.
 *
 * Only adjacent events are considered: a different event type or author in between breaks the run.
 * Temporary client-side squashing until the API squashes live edit events itself.
 */
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

/**
 * Converts a remote mutation (received through the document-pair listener) into the translog
 * transaction shape, so real-time edits can flow through the same pipeline as fetched
 * transactions ({@link getEditEvents}, diff calculation). `documentIDs` is intentionally left
 * empty; the effects map is keyed by the mutated document's id.
 */
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
 * Version-variant post-processing: rewrites `documentId` to the `versionId` on
 * `publishDocumentVersion` events, so the UI attributes the publish to the version document the
 * user is viewing instead of the published id. All other events pass through untouched.
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
 * Published-variant post-processing: attaches release metadata to `publishDocumentVersion` events
 * whose `versionId` belongs to a release. When the release document is in the releases store it is
 * attached as `release`; otherwise a stub `{_id: <releaseDocumentId>}` is attached so the UI can
 * still show that a (e.g. deleted/archived) release caused the publish. Draft publishes and all
 * other events pass through untouched.
 */
export function updatePublishedEvents(
  events: DocumentGroupEvent[],
  releases: ReleasesReducerState,
) {
  return events.map((event) => {
    if (isPublishDocumentVersionEvent(event)) {
      const releaseId = getVersionFromId(event.versionId)
      if (releaseId) {
        const releaseDocumentId = getReleaseDocumentIdFromReleaseId(releaseId)
        const release = releases.releases.get(releaseDocumentId)
        return {
          ...event,
          release: release || {_id: releaseDocumentId},
        }
      }
      return event
    }
    return event
  })
}

/**
 * Merges remote edits, API events and expanded edit events into one list sorted newest-first.
 *
 * Sorting rules:
 * - Primary: timestamp descending.
 * - Special case: a `publishDocumentVersion` event always sorts *before* the `editDocumentVersion`
 *   event it published (`publish.versionRevisionId === edit.revisionId`), regardless of their
 *   timestamps — the publish's API timestamp has seconds granularity and can tie with or trail the
 *   edit's transaction timestamp.
 *
 * Known quirk: the special case makes the comparator non-transitive (publish < paired edit while
 * both compare by timestamp against everything else), so ordering around such pairs can depend on
 * input order — tracked as a known issue.
 */
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
