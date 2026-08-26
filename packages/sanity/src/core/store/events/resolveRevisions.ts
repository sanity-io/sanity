import {type DocumentVariantType} from '../../util/getDocumentVariantType'
import {
  type DocumentGroupEvent,
  isCreateDocumentVersionEvent,
  isDeleteDocumentGroupEvent,
  isDeleteDocumentVersionEvent,
  isEditDocumentVersionEvent,
  isPublishDocumentVersionEvent,
} from './types'

/** Index of the event whose id matches `id`, `-1` when not found (or no id given). */
function indexOfEvent(events: DocumentGroupEvent[], id: string | null | undefined): number {
  return events.findIndex((event) => event.id === id)
}

/**
 * Resolves the `rev` search parameter against the loaded events (extracted from
 * `useEventsStore`):
 *
 * - `@lastPublished`: id of the newest publish event, `null` when none.
 * - `@lastEdited`: `revisionId` of the newest edit event; falls through to the raw value if none.
 * - `@release:<releaseId>`: id of the publish event for that release. While unresolved,
 *   `onLoadMore()` is invoked to fetch the next events page and `null` is returned (the UI shows
 *   the latest version, and no request is made with the raw `@release:` string). Pagination stops
 *   naturally when the cursor is exhausted (`onLoadMore` no-ops); if the event never appears, the
 *   revision stays `null` with no error surfaced.
 * - `undefined`: latest state; except when the newest event is a publish (its id is used) or a
 *   delete-version (the newest edit event's `revisionId` is used — the delete's
 *   `versionRevisionId` is unreliable).
 * - anything else: used as-is.
 */
export function resolveRevisionId({
  events,
  rev,
  loading,
  onLoadMore,
}: {
  events: DocumentGroupEvent[]
  rev: string | undefined
  loading: boolean
  /** Called when resolving needs events that are not loaded yet (unresolved `@release:` rev). */
  onLoadMore: () => void
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
    if (events.length > 0 && !loading) onLoadMore()
    // Not resolved yet (or the publish event doesn't exist): show the latest version instead of
    // leaking the raw `@release:` string to the history API.
    return null
  }

  if (!rev) {
    const [lastEvent] = events

    // if the most recent event was a publish, or delete version, use that event as the revision
    if (lastEvent) {
      if (isPublishDocumentVersionEvent(lastEvent)) {
        return lastEvent.id
      }
      if (isDeleteDocumentVersionEvent(lastEvent)) {
        // the versionRevisionId returned by this event is incorrect, see #content-releases-actions-history channel.
        // We need to use the last edit event we can find to grab the revision id.
        return events.find(isEditDocumentVersionEvent)?.revisionId
      }
    }
  }

  return rev
}

/**
 * Resolves the `since` search parameter against the loaded events and the resolved revision
 * (pure part of `useEventsStore`); only meaningful with a revision to compare against:
 *
 * - explicit revision id: used as-is.
 * - `@lastPublished` or `undefined`: the first publish event *older* than the current revision;
 *   falls back to the creation event; then to the event right after the revision (or the second
 *   event when no revision is selected).
 */
export function resolveSinceId({
  events,
  revisionId,
  since,
}: {
  events: DocumentGroupEvent[]
  revisionId: string | null | undefined
  since: string | undefined
}): string | null | undefined {
  if (since && since !== '@lastPublished') return since
  if (!events) return null

  if (since === '@lastPublished' || !since) {
    const revisionIndex = indexOfEvent(events, revisionId)
    // Skip the revision event and find the next published event
    const lastPublishedId = events.slice(revisionIndex + 1).find(isPublishDocumentVersionEvent)?.id
    if (lastPublishedId) return lastPublishedId

    // If it doesn't have a published event used the creation event as the since.
    const creationEvent = events.find(isCreateDocumentVersionEvent)
    if (creationEvent) return creationEvent.id
  }

  // rev has not been selected, the is seeing the last version of the document, select the event that comes after
  if (!revisionId) return events[1]?.id

  // If the user has selected a revisionId, we should show here the id of the event that is the previous event to the rev selected.
  const revisionEventIndex = indexOfEvent(events, revisionId)
  if (revisionEventIndex === -1) return null

  return events[revisionEventIndex + 1]?.id || null
}

/**
 * Computes the `[since, rev]` pair to write to the URL when the user picks `nextRev` in the
 * timeline: selecting the newest event clears the revision (back to "latest", except for version
 * documents whose newest event is a publish), and whichever side would make the range inverted
 * (since must be older than rev) is cleared.
 */
export function findRangeForRevision(
  nextRev: string,
  {
    events,
    since,
    revisionId,
    documentVariantType,
  }: {
    events: DocumentGroupEvent[]
    since: string | undefined
    revisionId: string | null | undefined
    documentVariantType: DocumentVariantType
  },
): [since: string | null, rev: string | null] {
  if (!events) return [null, null]
  const revisionIndex = indexOfEvent(events, nextRev)
  if (revisionIndex === 0) {
    // If last event is publish and we are in a version, select that one as the nextRev
    if (documentVariantType === 'version' && isPublishDocumentVersionEvent(events[0])) {
      return [since || null, nextRev]
    }
    // When selecting the first element of the events (latest) the rev is removed.
    return [since || null, null]
  }

  if (!since) {
    // Get the current revision and check if it's older than the next revision, in that case, use that value as the since.
    const currentRevisionIndex = indexOfEvent(events, revisionId)
    if (
      currentRevisionIndex === -1 ||
      revisionIndex === -1 ||
      revisionIndex > currentRevisionIndex
    ) {
      return [null, nextRev]
    }
    return [revisionId || null, nextRev]
  }
  const sinceIndex = indexOfEvent(events, since)

  if (sinceIndex === -1 || revisionIndex === -1) return [null, nextRev]
  if (sinceIndex <= revisionIndex) return [null, nextRev]
  return [since, nextRev]
}

/**
 * Computes the `[since, rev]` pair to write to the URL when the user picks `nextSince` in the
 * timeline: without a selected revision only the since is set, and the revision is cleared when
 * the range would be inverted (since must be older than rev).
 */
export function findRangeForSince(
  nextSince: string,
  {
    events,
    rev,
    revisionId,
  }: {
    events: DocumentGroupEvent[]
    rev: string | undefined
    revisionId: string | null | undefined
  },
): [since: string | null, rev: string | null] {
  if (!events) return [null, null]
  if (!rev || !revisionId) return [nextSince, null]
  const revisionIndex = indexOfEvent(events, revisionId)
  const sinceIndex = indexOfEvent(events, nextSince)
  if (sinceIndex === -1 || revisionIndex === -1) return [nextSince, null]
  if (sinceIndex <= revisionIndex) return [nextSince, null]
  return [nextSince, revisionId]
}

/**
 * Newest event that isn't a delete — used to restore deleted documents.
 */
export function getLastNonDeletedRevId(events: DocumentGroupEvent[]): string | null {
  return (
    events.find(
      (event) => !isDeleteDocumentGroupEvent(event) && !isDeleteDocumentVersionEvent(event),
    )?.id || null
  )
}
