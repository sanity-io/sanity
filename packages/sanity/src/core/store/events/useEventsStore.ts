import {type ObjectSchemaType} from '@sanity/types'
import {useCallback, useEffect, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {of} from 'rxjs'

import {useClient} from '../../hooks/useClient'
import {useSchema} from '../../hooks/useSchema'
import {useReleasesStore} from '../../releases/store/useReleasesStore'
import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../../releases/util/releasesClient'
import {useWorkspace} from '../../studio/workspace'
import {getDocumentVariantType} from '../../util/getDocumentVariantType'
import {createEventsStore} from './createEventsStore'
import {getDocumentAtRevision} from './getDocumentAtRevision'
import {
  type DocumentGroupEvent,
  type EventsStore,
  isCreateDocumentVersionEvent,
  isEditDocumentVersionEvent,
  isPublishDocumentVersionEvent,
} from './types'

export interface EventsObservableValue {
  events: DocumentGroupEvent[]
  nextCursor: string
  loading: boolean
  error: null | Error
}
const INITIAL_VALUE: EventsObservableValue = {
  events: [],
  nextCursor: '',
  loading: true,
  error: null,
}

/**
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
  const {state$: releases$} = useReleasesStore()
  const workspace = useWorkspace()

  const serverActionsEnabled = useMemo(() => {
    const configFlag = workspace.__internal_serverDocumentActions?.enabled
    return typeof configFlag === 'boolean' ? of(configFlag) : of(true)
  }, [workspace.__internal_serverDocumentActions?.enabled])
  const schema = useSchema()
  const schemaType = schema.get(documentType) as ObjectSchemaType | undefined
  const isLiveEdit = Boolean(schemaType?.liveEdit)

  const eventsStore = useMemo(
    () =>
      createEventsStore({
        client,
        documentId,
        documentType,
        releases$,
        serverActionsEnabled,
        isLiveEdit,
      }),
    [client, documentId, documentType, releases$, serverActionsEnabled, isLiveEdit],
  )
  const {events, loading, error, nextCursor} = useObservable(
    eventsStore.eventsObservable$,
    INITIAL_VALUE,
  )

  useEffect(() => {
    // Subscribe to the remove edits - listening to transactions received from the document pair.
    const subscription = eventsStore.remoteTransactionsListener()
    return () => {
      subscription.unsubscribe()
    }
  }, [eventsStore])

  const revisionId = useMemo(() => {
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
      if (events.length > 0 && !loading) eventsStore.loadMoreEvents()
    }

    if (!rev) {
      const [lastEvent] = events

      // if the most recent event was a publish, use that event as the revision
      if (lastEvent && isPublishDocumentVersionEvent(lastEvent)) {
        return lastEvent.id
      }
    }

    return rev
  }, [events, rev, eventsStore, loading])

  const revision$ = useMemo(
    () =>
      revisionId ? getDocumentAtRevision({client, documentId, revisionId: revisionId}) : of(null),
    [client, documentId, revisionId],
  )
  const revision = useObservable(revision$, null)

  const sinceId = useMemo(() => {
    if (since && since !== '@lastPublished') return since
    if (!events) return null

    if (since === '@lastPublished' || !since) {
      const revisionIndex = events.findIndex((e) => e.id === revisionId)
      // Skip the revision event and find the next published event
      const lastPublishedId = events
        .slice(revisionIndex + 1)
        .find(isPublishDocumentVersionEvent)?.id
      if (lastPublishedId) return lastPublishedId

      // If it doesn't have a published event used the creation event as the since.
      const creationEvent = events.find(isCreateDocumentVersionEvent)
      if (creationEvent) return creationEvent.id
    }

    // rev has not been selected, the is seeing the last version of the document, select the event that comes after
    if (!revisionId) return events[1]?.id

    // If the user has selected a revisionId, we should show here the id of the event that is the previous event to the rev selected.
    const revisionEventIndex = events.findIndex((e) => e.id === revisionId)
    if (revisionEventIndex === -1) return null

    return events[revisionEventIndex + 1]?.id || null
  }, [events, revisionId, since])

  const since$ = useMemo(
    () => (sinceId ? getDocumentAtRevision({client, documentId, revisionId: sinceId}) : of(null)),
    [sinceId, client, documentId],
  )

  const getChangesList = useCallback(
    () => eventsStore.getDocumentChanges(revision$, since$),
    [eventsStore, revision$, since$],
  )

  const sinceRevision = useObservable(since$, null)

  const documentVariantType = getDocumentVariantType(documentId)
  const findRangeForRevision = useCallback(
    (nextRev: string): [string | null, string | null] => {
      if (!events) return [null, null]
      const revisionIndex = events.findIndex((event) => event.id === nextRev)
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
        const currentRevisionIndex = events.findIndex((event) => event.id === revisionId)
        if (
          currentRevisionIndex === -1 ||
          revisionIndex === -1 ||
          revisionIndex > currentRevisionIndex
        ) {
          return [null, nextRev]
        }
        return [revisionId || null, nextRev]
      }
      const sinceIndex = events.findIndex((event) => event.id === since)

      if (sinceIndex === -1 || revisionIndex === -1) return [null, nextRev]
      if (sinceIndex < revisionIndex) return [null, nextRev]
      if (sinceIndex === revisionIndex) return [null, nextRev]
      return [since, nextRev]
    },
    [events, since, documentVariantType, revisionId],
  )

  const findRangeForSince = useCallback(
    (nextSince: string): [string | null, string | null] => {
      if (!events) return [null, null]
      if (!rev || !revisionId) return [nextSince, null]
      const revisionIndex = events.findIndex((event) => event.id === revisionId)
      const sinceIndex = events.findIndex((event) => event.id === nextSince)
      if (sinceIndex === -1 || revisionIndex === -1) return [nextSince, null]
      if (sinceIndex < revisionIndex) return [nextSince, null]
      if (sinceIndex === revisionIndex) return [nextSince, null]
      return [nextSince, revisionId]
    },
    [events, rev, revisionId],
  )

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
  }
}
