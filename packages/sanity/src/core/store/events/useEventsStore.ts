/* eslint-disable no-console */
/* eslint-disable max-nested-callbacks */
import {useCallback, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {BehaviorSubject, combineLatest, from, type Observable, of} from 'rxjs'
import {catchError, map, scan, shareReplay, startWith, switchMap, tap} from 'rxjs/operators'
import {type SanityClient, type SanityDocument} from 'sanity'

import {useClient} from '../../hooks'
import {useReleasesStore} from '../../releases/store/useReleasesStore'
import {getReleaseIdFromName} from '../../releases/util/getReleaseIdFromName'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'
import {getVersionFromId} from '../../util/draftUtils'
import {type DocumentVariantType, getDocumentVariantType} from '../../util/getDocumentVariantType'
import {decorateEvents} from './decorateEvents'
import {getDocumentChanges} from './getDocumentChanges'
import {getDocumentTransactions} from './getDocumentTransactions'
import {getEditEvents} from './getEditEvents'
import {
  type DocumentGroupEvent,
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
import {useExpandEvents} from './useExpandEvents'
import {useRemoteTransactions} from './useRemoteTransactions'

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
      shareReplay(1),
    )
}

const addEventId = (
  event: Omit<DocumentGroupEvent, 'id'>,
  documentVariantType: DocumentVariantType,
): DocumentGroupEvent => {
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
  const {state$: releases$} = useReleasesStore()

  const {events$, refetchEvents$, refreshEvents} = useMemo(() => {
    const refetchEventsTrigger$ = new BehaviorSubject<{
      nextCursor: string | null
      origin: 'loadMore' | 'refresh' | 'initial'
    }>({
      nextCursor: null,
      origin: 'initial',
    })

    const fetchEvents = ({limit, nextCursor}: {limit: number; nextCursor: string | null}) => {
      const params = new URLSearchParams({
        // This is not working yet, CL needs to fix it.
        limit: limit.toString(),
      })
      if (nextCursor) {
        params.append('nextCursor', nextCursor)
      }
      return client.observable
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
                response.events[documentId]?.map((ev) => addEventId(ev, documentVariantType)) || [],
              nextCursor: response.nextCursor,
              loading: false,
              error: null,
            }
          }),
        )
    }

    const fetchTransactions = (events: DocumentGroupEvent[]) => {
      const eventWithRevision =
        documentVariantType === 'version'
          ? events.find(isCreateDocumentVersionEvent)
          : events.find((event) => 'versionRevisionId' in event && event.versionRevisionId)

      const revisionId =
        eventWithRevision &&
        'versionRevisionId' in eventWithRevision &&
        eventWithRevision.versionRevisionId

      if (!revisionId) {
        return of([])
      }
      return from(
        getDocumentTransactions({
          client,
          documentId,
          fromTransaction: revisionId,
          toTransaction: undefined, // We need to get up to the present moment
        }),
      )
    }

    return {
      events$: refetchEventsTrigger$.pipe(
        switchMap(({nextCursor, origin}) => {
          return fetchEvents({
            nextCursor: nextCursor,
            limit: origin === 'refresh' ? 10 : 100,
          }).pipe(
            switchMap((response) => {
              if (documentVariantType === 'published' || origin === 'loadMore') {
                // For the published document we don't need to fetch the edit transactions.
                return of({...response, origin})
              }
              return fetchTransactions(response.events).pipe(
                map((transactions) => {
                  const editEvents = getEditEvents(transactions, documentId)
                  return {...response, events: [...editEvents, ...response.events], origin}
                }),
              )
            }),

            catchError((error: Error) => {
              console.error('Error fetching events', error)
              return [{events: [], nextCursor: '', loading: false, error: error, origin}]
            }),
            startWith({events: [], nextCursor: '', loading: true, error: null, origin}),
          )
        }),
        scan((prev, next) => {
          const removeDupes = [...prev.events, ...next.events].reduce((acc, event) => {
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

          return {
            events: Array.from(removeDupes.values()),
            // If we are refreshing, we should keep the cursor as it was before.
            nextCursor: next.origin === 'refresh' ? prev.nextCursor : next.nextCursor,
            loading: next.loading,
            error: next.error,
          }
        }, INITIAL_VALUE),
        shareReplay(1),
      ),
      refetchEvents$: refetchEventsTrigger$,
      refreshEvents: () => refetchEventsTrigger$.next({nextCursor: null, origin: 'refresh'}),
    }
  }, [client, documentId, documentVariantType])

  const remoteTransactions$ = useRemoteTransactions({
    client,
    documentId,
    documentType,
    documentVariantType,
    onRefetch: refreshEvents,
  })

  const {expandedEvents$, handleExpandEvent} = useExpandEvents({client, documentId})

  const observable$ = useMemo(() => {
    return combineLatest([releases$, events$, remoteTransactions$, expandedEvents$]).pipe(
      map(
        ([releases, {events, nextCursor, loading, error}, remoteTransactions, expandedEvents]) => {
          const remoteEdits = getEditEvents(remoteTransactions, documentId)
          const eventsWithRemoteEdits = [...remoteEdits, ...events, ...expandedEvents].sort(
            // Sort by timestamp, newest first
            (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp),
          )

          if (documentVariantType === 'published') {
            // We need to add the release information to the publish events
            return {
              events: eventsWithRemoteEdits.map((event) => {
                if (event.type === 'PublishDocumentVersion') {
                  const releaseId = getVersionFromId(event.versionId)
                  if (releaseId) {
                    const release = releases.releases.get(getReleaseIdFromName(releaseId))
                    return {...event, release: release}
                  }
                  return event
                }
                return event
              }),
              nextCursor: nextCursor,
              loading: loading,
              error: error,
            }
          }

          if (documentVariantType === 'draft') {
            decorateEvents(eventsWithRemoteEdits)
            return {
              events: eventsWithRemoteEdits,
              nextCursor: nextCursor,
              loading: loading,
              error: error,
            }
          }
          return {
            events: eventsWithRemoteEdits,
            nextCursor: nextCursor,
            loading: loading,
            error: error,
          }
        },
      ),
    )
  }, [releases$, events$, remoteTransactions$, expandedEvents$, documentId, documentVariantType])

  const {events, loading, error, nextCursor} = useObservable(observable$, INITIAL_VALUE)

  const handleLoadMoreEvents = useCallback(() => {
    if (nextCursor) {
      const currentValue = refetchEvents$.getValue()
      if (currentValue.nextCursor !== nextCursor) {
        refetchEvents$.next({origin: 'loadMore', nextCursor: nextCursor})
      }
    }
  }, [nextCursor, refetchEvents$])

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
  const revision = useObservable(revision$, null)

  const sinceId = useMemo(() => {
    if (since && since !== '@lastPublished') return since
    if (!events) return null

    if (since === '@lastPublished') {
      const lastPublishedId = events.find(isPublishDocumentVersionEvent)?.id
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
  const sinceRevision = useObservable(since$, null)

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

  const changesList = useCallback(
    ({to, since: sinceDoc}: {to: SanityDocument; since: SanityDocument | null}) => {
      const selectedToEvent = events.find((event) => event.id === to._rev)
      const isShowingCreationEvent =
        selectedToEvent && isCreateDocumentVersionEvent(selectedToEvent)

      // TODO: We could pass here the remoteTransactions to avoid fetching them again specially when editing a document.
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
    loadMoreEvents: handleLoadMoreEvents,
    changesList,
    handleExpandEvent,
  }
}
