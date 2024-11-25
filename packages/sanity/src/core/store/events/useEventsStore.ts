/* eslint-disable no-console */
/* eslint-disable max-nested-callbacks */
import {useCallback, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {combineLatest, from, type Observable, of, Subject} from 'rxjs'
import {catchError, map, startWith, switchMap, tap} from 'rxjs/operators'
import {type SanityClient, type SanityDocument} from 'sanity'

import {useClient} from '../../hooks'
import {useReleasesStore} from '../../releases/store/useReleasesStore'
import {getReleaseIdFromName} from '../../releases/util/getReleaseIdFromName'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'
import {getVersionFromId, isVersionId} from '../../util/draftUtils'
import {type DocumentVariantType, getDocumentVariantType} from '../../util/getDocumentVariantType'
import {getDocumentChanges} from './getDocumentChanges'
import {getDocumentTransactions} from './getDocumentTransactions'
import {getEditEvents} from './getEditEvents'
import {
  type DocumentGroupEvent,
  type EditDocumentVersionEvent,
  type EventsStore,
  type EventsStoreRevision,
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
import {useRemoteTransactions} from './useRemoteTransactions'

const INITIAL_VALUE = {
  events: [],
  nextCursor: null,
  loading: true,
  error: null,
}
const documentRevisionCache: Record<string, SanityDocument> = Object.create(null)

function getDocumentAtRevision({
  client,
  documentId,
  revisionId,
}: {
  client: SanityClient
  documentId: string
  revisionId: string | null | undefined
}): Observable<EventsStoreRevision | null> {
  if (!revisionId) {
    return of(null)
  }
  const cacheKey = `${documentId}@${revisionId}`
  const dataset = client.config().dataset
  if (documentRevisionCache[cacheKey]) {
    return of({document: documentRevisionCache[cacheKey], loading: false, revisionId: revisionId})
  }
  return client.observable
    .request<{documents: SanityDocument[]}>({
      url: `/data/history/${dataset}/documents/${documentId}?revision=${revisionId}`,
      tag: 'get-document-revision',
    })
    .pipe(
      map((response) => {
        const document = response.documents[0]
        return {document: document, loading: false, revisionId: revisionId}
      }),
      tap((resp) => {
        documentRevisionCache[cacheKey] = resp.document
      }),
      catchError((error: Error) => {
        // TODO: Handle error
        console.error('Error fetching document at revision', error)
        return [{document: null, loading: false, revisionId: revisionId}]
      }),
      startWith({document: null, loading: true, revisionId: revisionId}),
    )
}

const addEventId = (
  event: Omit<DocumentGroupEvent, 'id'>,
  documentVariantType: DocumentVariantType,
): DocumentGroupEvent => {
  let id = ''
  if (isCreateDocumentVersionEvent(event)) {
    id = documentVariantType === 'published' ? event.revisionId : event.versionRevisionId
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
  const documentVariantType = getDocumentVariantType(documentId)

  const refreshEventsTrigger$ = useMemo(() => new Subject<void>(), [])
  const refetchEvents = useCallback(() => refreshEventsTrigger$.next(), [refreshEventsTrigger$])
  const remoteTransactions$ = useRemoteTransactions({
    client,
    documentId,
    documentType,
    documentVariantType,
    onRefetch: refetchEvents,
  })

  const {state$} = useReleasesStore()

  const eventsObservable$: Observable<{
    events: DocumentGroupEvent[]
    nextCursor: string
    loading: boolean
    error: null | Error
  }> = useMemo(() => {
    const params = new URLSearchParams({
      // This is not working yet, CL needs to fix it.
      limit: '100',
    })
    return refreshEventsTrigger$.pipe(
      startWith(undefined), // Emit once initially to start the observable
      switchMap(() =>
        client.observable
          .request<{
            events: Record<string, Omit<DocumentGroupEvent, 'id'>[]>
            nextCursor: string
          }>({
            url: `/data/events/${client.config().dataset}/documents/${documentId}?${params.toString()}`,
            tag: 'get-document-events',
          })
          .pipe(
            map((response) => {
              return {
                events:
                  response.events[documentId]?.map((ev) => addEventId(ev, documentVariantType)) ||
                  [],
                nextCursor: response.nextCursor,
                loading: false,
                error: null,
              }
            }),
            // This is temporal - The API is returning duplicated events, we need to remove them.
            map((response) => {
              return {
                ...response,
                events: response.events.filter(
                  (event, index) =>
                    index === response.events.length - 1 || event.type !== 'CreateDocumentVersion',
                ),
              }
            }),
            // Get the edit events if necessary.
            switchMap((response) => {
              if (documentVariantType === 'published') {
                // For the published document we don't need to fetch the edit transactions.
                return of(response)
              }

              // TODO: Improve how we get this value.
              const lastVersionRevisionIdIndex = response.events.findIndex(
                (event) => 'versionRevisionId' in event && event.versionRevisionId,
              )
              // TODO: Think how to handle more events in a version document.
              // Version docs are kind of short-lived, they are created, edited and published, once published they are not re-created again.
              if (
                lastVersionRevisionIdIndex !== 0 &&
                response.events.length &&
                isVersionId(documentId)
              ) {
                console.log('Verify this, it could be an error', response.events)
              }
              const lastEventVersionRevisionId = // @ts-expect-error - Fix this
                response.events[lastVersionRevisionIdIndex]?.versionRevisionId as string

              if (!lastEventVersionRevisionId) {
                return of(response)
              }
              return from(
                getDocumentTransactions({
                  client,
                  documentId,
                  fromTransaction: lastEventVersionRevisionId,
                  toTransaction: undefined, // We need to get up to the present moment
                }),
              ).pipe(
                map((transactions) => {
                  const editEvents = getEditEvents(transactions, documentId)
                  return {...response, events: [...editEvents, ...response.events]}
                }),
              )
            }),
            catchError((error: Error) => {
              console.error('Error fetching events', error)
              return [{events: [], nextCursor: '', loading: false, error: error}]
            }),
            startWith({events: [], nextCursor: '', loading: true, error: null}),
          ),
      ),
    )
  }, [client, documentId, refreshEventsTrigger$, documentVariantType])

  const observable$ = useMemo(() => {
    return combineLatest([state$, eventsObservable$, remoteTransactions$]).pipe(
      map(([releases, {events, nextCursor, loading, error}, remoteTransactions]) => {
        const remoteEdits = getEditEvents(remoteTransactions, documentId)
        const withRemoteEdits = [...remoteEdits, ...events].sort(
          // Sort by timestamp, newest first
          (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp),
        )

        return {
          events: withRemoteEdits.map((event) => {
            if (event.type === 'PublishDocumentVersion') {
              const releaseId = getVersionFromId(event.versionId)

              if (releaseId) {
                const release = releases.releases.get(getReleaseIdFromName(releaseId))

                return {
                  ...event,
                  release: release,
                }
              }
              return event
            }
            return event
          }),
          nextCursor: nextCursor,
          loading: loading,
          error: error,
        }
      }),
    )
  }, [state$, eventsObservable$, remoteTransactions$, documentId])

  const {events, loading, error, nextCursor} = useObservable(observable$, INITIAL_VALUE)
  const revisionId = useMemo(() => {
    if (rev === '@lastEdited') {
      const editEvent = events.find((event) => isEditDocumentVersionEvent(event)) as
        | EditDocumentVersionEvent
        | undefined
      if (editEvent) return editEvent.revisionId
      // If we don't have an edit event, we should return the last event that is not a publish | delete event
      const lastEvent = events.find((event) => {
        return (
          !isPublishDocumentVersionEvent(event) &&
          !isDeleteDocumentGroupEvent(event) &&
          !isDeleteDocumentVersionEvent(event)
        )
      })
      return lastEvent?.id || null
    }
    return rev
  }, [events, rev])
  const revision$ = useMemo(
    () => getDocumentAtRevision({client, documentId, revisionId: revisionId}),
    [client, documentId, revisionId],
  )
  const revision = useObservable(revision$, null)

  const sinceId = useMemo(() => {
    if (since && since !== '@lastPublished') return since
    if (!events) return null

    if (since === '@lastPublished') {
      // TODO:  Find the last published event
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
  const sinceRevision = useObservable(since$, null)

  const findRangeForRevision = useCallback(
    (nextRev: string): [string | null, string | null] => {
      if (!events) return [null, null]
      const revisionIndex = events.findIndex((event) => event.id === nextRev)
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
    [events, since, revisionId],
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

  const changesList = useCallback(
    ({to, since: sinceDoc}: {to: SanityDocument; since: SanityDocument | null}) => {
      const selectedToEvent = events.find((event) => event.id === to._rev)
      const isShowingCreationEvent =
        selectedToEvent && isCreateDocumentVersionEvent(selectedToEvent)

      // TODO: We could pass here the remote edits to avoid fetching them again.
      // Consider using the remoteTransactions$ observable to get the remote edits.
      return getDocumentChanges({
        client,
        events,
        documentId,
        to,
        since: isShowingCreationEvent
          ? ({_type: to._type, _id: to._id} as SanityDocument)
          : sinceDoc,
      })
    },
    [client, events, documentId],
  )

  return {
    documentVariantType: documentVariantType,
    enabled: true,
    events: events,
    nextCursor: nextCursor,
    loading: loading,
    error: error,
    revision: revision,
    sinceRevision: sinceRevision,
    findRangeForRevision: findRangeForRevision,
    findRangeForSince: findRangeForSince,
    loadMoreEvents: () => {
      console.log('IMPLEMENT ME PLEASE')
    },
    changesList,
  }
}
