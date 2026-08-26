import {type ObjectSchemaType} from '@sanity/types'
import {useCallback, useEffect, useMemo} from 'react'
import {useObservable, useSyncObservable} from 'react-rx'
import {of} from 'rxjs'

import {useClient} from '../../hooks/useClient'
import {useSchema} from '../../hooks/useSchema'
import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../../releases/util/releasesClient'
import {getDocumentVariantType} from '../../util/getDocumentVariantType'
import {createEventsStore} from './createEventsStore'
import {getDocumentAtRevision as getDocumentAtRevisionFunction} from './getDocumentAtRevision'
import {
  findRangeForRevision as findRangeForRevisionPure,
  findRangeForSince as findRangeForSincePure,
  getLastNonDeletedRevId,
  resolveRevisionId,
  resolveSinceId,
} from './resolveRevisions'
import {type EventsStore, INITIAL_EVENTS_VALUE} from './types'

/**
 * React entry point of the events store: creates a `createEventsStore` instance for the document
 * (recreated when client/document/liveEdit change), subscribes the remote-transactions
 * listener for the component lifetime, and resolves the `rev`/`since` selection against the
 * loaded events.
 *
 * The resolution logic lives in `resolveRevisions.ts`:
 * - `rev` → `revisionId` via {@link resolveRevisionId}, which receives `loadMoreEvents` as its
 *   `onLoadMore` callback: unresolved `@release:` revs keep paginating until the release's
 *   publish event is loaded — with no termination if it never appears (known issue).
 * - `since` → `sinceId` via {@link resolveSinceId}, only meaningful with a revision to compare
 *   against.
 * - `findRangeForRevision(nextRev)` / `findRangeForSince(nextSince)` compute the `[since, rev]`
 *   pair to write to the URL when the user picks a new revision/since in the timeline, clearing
 *   whichever side would make the range inverted (since must be older than rev).
 *
 * Also exposes per-revision document fetching (`getDocumentAtRevision`, plus resolved `revision` /
 * `sinceRevision` snapshots), `getChangesList` (diff between the resolved revisions),
 * `expandEvent`, `loadMoreEvents` and `lastNonDeletedRevId` (newest event that isn't a delete —
 * used to restore deleted documents).
 *
 * @internal
 */
export function useEventsStore({
  documentId,
  documentType,
  rev,
  since,
}: {
  documentId: string
  documentType: string
  rev?: string | '@lastEdited' | '@lastPublished'
  since?: string | '@lastPublished'
}): EventsStore {
  const client = useClient(RELEASES_STUDIO_CLIENT_OPTIONS)

  const schema = useSchema()
  const schemaType = schema.get(documentType) as ObjectSchemaType | undefined
  const isLiveEdit = Boolean(schemaType?.liveEdit)

  const eventsStore = useMemo(
    () =>
      createEventsStore({
        client,
        documentId,
        documentType,
        isLiveEdit,
      }),
    [client, documentId, documentType, isLiveEdit],
  )
  // Deferred (per review): these events drive the review-changes list, which
  // users don't expect to update synchronously on every edit. `revisionId` /
  // `sinceId` and the `revision` / `sinceRevision` documents are all derived
  // from this deferred value, so they lag together (coherently) rather than
  // pairing a stale diff with fresh state. Verified against the
  // `revertArrayChanges` e2e flow, which previously crashed only when the
  // diff was deferred incoherently while events stayed live.
  const {events, loading, error, nextCursor} = useObservable(
    eventsStore.eventsObservable$,
    INITIAL_EVENTS_VALUE,
  )

  useEffect(() => {
    // Subscribe to the remove edits - listening to transactions received from the document pair.
    const subscription = eventsStore.remoteTransactionsListener()
    return () => {
      subscription.unsubscribe()
    }
  }, [eventsStore])

  const revisionId = useMemo(
    () => resolveRevisionId({events, rev, loading, onLoadMore: eventsStore.loadMoreEvents}),
    [events, rev, loading, eventsStore],
  )

  const getDocumentAtRevision = useCallback(
    (revision: string) => {
      return getDocumentAtRevisionFunction({
        client,
        documentId,
        revisionId: revision,
      })
    },
    [client, documentId],
  )

  const revision$ = useMemo(
    () => (revisionId ? getDocumentAtRevision(revisionId) : of(null)),
    [getDocumentAtRevision, revisionId],
  )
  const revision = useSyncObservable(revision$, null)

  const sinceId = useMemo(
    () => resolveSinceId({events, revisionId, since}),
    [events, revisionId, since],
  )

  const since$ = useMemo(
    () => (sinceId ? getDocumentAtRevision(sinceId) : of(null)),
    [getDocumentAtRevision, sinceId],
  )

  const getChangesList = useCallback(
    () => eventsStore.getDocumentChanges(revision$, since$),
    [eventsStore, revision$, since$],
  )

  const sinceRevision = useSyncObservable(since$, null)

  const documentVariantType = getDocumentVariantType(documentId)
  const findRangeForRevision = useCallback(
    (nextRev: string): [string | null, string | null] =>
      findRangeForRevisionPure(nextRev, {events, since, revisionId, documentVariantType}),
    [events, since, documentVariantType, revisionId],
  )

  const findRangeForSince = useCallback(
    (nextSince: string): [string | null, string | null] =>
      findRangeForSincePure(nextSince, {events, rev, revisionId}),
    [events, rev, revisionId],
  )

  const lastNonDeletedRevId = useMemo(() => getLastNonDeletedRevId(events), [events])

  return {
    events,
    nextCursor,
    loading,
    error,
    revision,
    sinceRevision,
    findRangeForRevision,
    findRangeForSince,
    loadMoreEvents: eventsStore.loadMoreEvents,
    expandEvent: eventsStore.handleExpandEvent,
    getChangesList,
    getDocumentAtRevision,
    lastNonDeletedRevId,
  }
}
