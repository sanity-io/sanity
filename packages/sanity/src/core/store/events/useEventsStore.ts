/* eslint-disable no-console */
/* eslint-disable max-nested-callbacks */
import {type ObjectSchemaType} from '@sanity/types'
import {useCallback, useEffect, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {of} from 'rxjs'

import {useClient, useSchema} from '../../hooks'
import {useReleasesStore} from '../../releases/store/useReleasesStore'
import {useWorkspace} from '../../studio/workspace'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'
import {getDocumentVariantType} from '../../util/getDocumentVariantType'
import {fetchFeatureToggle} from '../_legacy/document/document-pair/utils/fetchFeatureToggle'
import {createEventsObservable} from './createEventsObservable'
import {getDocumentAtRevision} from './getDocumentAtRevision'
import {getDocumentChanges} from './getDocumentChanges'
import {getExpandEvents} from './getExpandEvents'
import {getInitialFetchEvents} from './getInitialFetchEvents'
import {getRemoteTransactionsSubscription} from './getRemoteTransactionsSubscription'
import {
  type DocumentGroupEvent,
  type EventsStore,
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

export function useEventsStore({
  documentId,
  documentType,
  rev,
  since,
}: {
  documentId: string
  documentType: string
  rev?: string | '@lastEdited'
  since?: string | '@lastPublished'
}): EventsStore {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  const {state$: releases$} = useReleasesStore()
  const workspace = useWorkspace()
  const serverActionsEnabled = useMemo(() => {
    const configFlag = workspace.__internal_serverDocumentActions?.enabled
    // If it's explicitly set, let it override the feature toggle
    return typeof configFlag === 'boolean' ? of(configFlag as boolean) : fetchFeatureToggle(client)
  }, [client, workspace.__internal_serverDocumentActions?.enabled])
  const schema = useSchema()
  const schemaType = schema.get(documentType) as ObjectSchemaType | undefined
  const isLiveEdit = Boolean(schemaType?.liveEdit)

  const {events$, loadMore, reloadEvents} = useMemo(
    () => getInitialFetchEvents({client, documentId}),
    [client, documentId],
  )
  const {expandedEvents$, handleExpandEvent} = useMemo(
    () => getExpandEvents({client, documentId}),
    [client, documentId],
  )
  const {remoteTransactions$, remoteEdits$, subscribe} = useMemo(
    () =>
      getRemoteTransactionsSubscription({
        client,
        documentId,
        documentType,
        isLiveEdit,
        serverActionsEnabled,
        onRefetch: reloadEvents,
      }),
    [client, documentId, documentType, isLiveEdit, serverActionsEnabled, reloadEvents],
  )
  const eventsObservable$ = useMemo(() => {
    return createEventsObservable({releases$, events$, remoteEdits$, expandedEvents$, documentId})
  }, [releases$, events$, remoteEdits$, expandedEvents$, documentId])

  const {events, loading, error, nextCursor} = useObservable(eventsObservable$, INITIAL_VALUE)

  useEffect(() => {
    // Subscribe to the remove edits - listening to transactions received from the document pair.
    const subscription = subscribe()
    return () => {
      subscription.unsubscribe()
    }
  }, [subscribe])

  const revisionId = useMemo(() => {
    if (rev === '@lastPublished') {
      const publishEvent = events.find(isPublishDocumentVersionEvent)
      return publishEvent?.id || null
    }
    if (rev === '@lastEdited') {
      const editEvent = events.find((event) => isEditDocumentVersionEvent(event))
      if (editEvent) return editEvent.revisionId
    }
    return rev
  }, [events, rev])

  const revision$ = useMemo(
    () => getDocumentAtRevision({client, documentId, revisionId: revisionId}),
    [client, documentId, revisionId],
  )
  const revision = useObservable(revision$)

  const sinceId = useMemo(() => {
    if (since && since !== '@lastPublished') return since
    if (!events) return null

    if (since === '@lastPublished' || !since) {
      // Skip the first published, the since and rev cannot be the same.
      const lastPublishedId = events.slice(1).find(isPublishDocumentVersionEvent)?.id
      if (lastPublishedId) return lastPublishedId
    }

    // We want to try to infer the since Id from the events, we want to compare to the last event that happened before the rev as fallback
    if (!revisionId) {
      // rev has not been selected, the user will be seeing the last version of the document.
      // we need to select the event that comes after
      return events[1]?.id
    }

    // If the user has selected a revisionId, we should show here the id of the event that is the previous event to the rev selected.
    const revisionEventIndex = events.findIndex((e) => e.id === revisionId)
    if (revisionEventIndex === -1) return null

    return events[revisionEventIndex + 1]?.id || null
  }, [events, revisionId, since])

  const since$ = useMemo(
    () => getDocumentAtRevision({client, documentId, revisionId: sinceId}),
    [sinceId, client, documentId],
  )
  const sinceRevision = useObservable(since$)

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
      if (!revisionId) return [nextSince, null]
      const revisionIndex = events.findIndex((event) => event.id === revisionId)
      const sinceIndex = events.findIndex((event) => event.id === nextSince)
      if (sinceIndex === -1 || revisionIndex === -1) return [nextSince, null]
      if (sinceIndex < revisionIndex) return [nextSince, null]
      if (sinceIndex === revisionIndex) return [nextSince, null]
      return [nextSince, revisionId]
    },
    [events, revisionId],
  )

  const getChangesList = useCallback(() => {
    return getDocumentChanges({
      client,
      eventsObservable$,
      documentId,
      remoteTransactions$,
      since$,
      to$: revision$,
    })
  }, [client, eventsObservable$, documentId, remoteTransactions$, since$, revision$])

  return {
    documentVariantType: documentVariantType,
    enabled: true as const,
    events: events,
    nextCursor: nextCursor,
    loading: loading,
    error: error,
    revision: revision || null,
    sinceRevision: sinceRevision || null,
    findRangeForRevision: findRangeForRevision,
    findRangeForSince: findRangeForSince,
    loadMoreEvents: loadMore,
    getChangesList,
    expandEvent: handleExpandEvent,
  }
}
