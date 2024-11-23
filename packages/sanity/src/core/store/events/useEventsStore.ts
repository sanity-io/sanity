/* eslint-disable max-nested-callbacks */
import {useCallback, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {BehaviorSubject, combineLatest, from, type Observable, of, Subject} from 'rxjs'
import {catchError, map, startWith, switchMap, tap} from 'rxjs/operators'
import {
  type MendozaPatch,
  type SanityClient,
  type SanityDocument,
  type TransactionLogEventWithEffects,
  type WithVersion,
} from 'sanity'

import {useClient} from '../../hooks'
import {useReleasesStore} from '../../releases/store/useReleasesStore'
import {getReleaseIdFromName} from '../../releases/util/getReleaseIdFromName'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'
import {getPublishedId, getVersionFromId, isVersionId} from '../../util/draftUtils'
import {type DocumentRemoteMutationEvent} from '../_legacy/document/buffered-doc/types'
import {getDocumentChanges} from './getDocumentChanges'
import {getDocumentTransactions} from './getDocumentTransactions'
import {getEditEvents, getEffectState} from './getEditEvents'
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
import {useRemoteMutations} from './useRemoteMutations'

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
  isPublishedDoc: boolean,
): DocumentGroupEvent => {
  let id = ''
  if (isCreateDocumentVersionEvent(event)) {
    id = isPublishedDoc ? event.revisionId : event.versionRevisionId
  } else if (isDeleteDocumentVersionEvent(event)) {
    id = isPublishedDoc ? `deleteAt-${event.timestamp}` : event.versionRevisionId
  } else if (isPublishDocumentVersionEvent(event)) {
    id = isPublishedDoc ? event.revisionId : event.versionRevisionId || event.revisionId
  } else if (isUnpublishDocumentEvent(event)) {
    // This event is only available for the published document
    id = isPublishedDoc ? `unpublishAt-${event.timestamp}` : ''
  } else if (isScheduleDocumentVersionEvent(event)) {
    // This event is only available for the version document
    id = isPublishedDoc ? '' : event.versionRevisionId
  } else if (isUnscheduleDocumentVersionEvent(event)) {
    id = isPublishedDoc ? '' : event.versionRevisionId
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

function remoteMutationToTransaction(
  event: DocumentRemoteMutationEvent,
): TransactionLogEventWithEffects {
  return {
    author: event.author,
    documentIDs: [],
    id: event.transactionId,
    timestamp: event.timestamp.toISOString(),
    effects: {
      [event.head._id]: {
        // TODO: Find a way to validate that is a MendozaPatch
        apply: event.effects.apply as MendozaPatch,
        revert: event.effects.revert as MendozaPatch,
      },
    },
  }
}

export function useEventsStore({
  documentId,
  documentType,
  rev,
  since,
}: {
  documentId: string
  documentType: string
  rev?: string
  since?: string
}): EventsStore {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  const remoteTransactions$ = useMemo(
    () => new BehaviorSubject<TransactionLogEventWithEffects[]>([]),
    [],
  )

  const {state$} = useReleasesStore()

  const refreshEventsTrigger$ = useMemo(() => new Subject<void>(), [])
  const eventsObservable$: Observable<{
    events: DocumentGroupEvent[]
    nextCursor: string
    loading: boolean
    error: null | Error
  }> = useMemo(() => {
    const isPublishedDoc = getPublishedId(documentId) === documentId

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
                  response.events[documentId]?.map((ev) => addEventId(ev, isPublishedDoc)) || [],
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
              if (isPublishedDoc) {
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
                !isPublishedDoc &&
                response.events.length &&
                isVersionId(documentId)
              ) {
                console.log('Verify this, it could be an error', response.events)
              }
              const lastEventVersionRevisionId = response.events[lastVersionRevisionIdIndex]
                ?.versionRevisionId as string

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
  }, [client, documentId, refreshEventsTrigger$])

  const onUpdate = useCallback(
    (remoteMutation: WithVersion<DocumentRemoteMutationEvent>) => {
      // If the remote mutation happened to a published document we need to re-fetch the events.
      // If it happens to a version, we need to add the mutation to the list of events.
      // If it happens to a draft: we need to decide if it looks like an event
      //       Looks like an event: we need to refetch the events list (e.g. publish, discard)
      //       Doesn't look like an event: we need to add the mutation to the list of events.
      const version = remoteMutation.version
      if (version === 'version') {
        remoteTransactions$.next([
          ...remoteTransactions$.value,
          remoteMutationToTransaction(remoteMutation),
        ])
        return
      }
      if (version === 'draft') {
        const effectState = getEffectState({
          apply: remoteMutation.effects.apply as MendozaPatch,
          revert: remoteMutation.effects.revert as MendozaPatch,
        })
        if (effectState === 'upsert' || effectState === 'unedited') {
          remoteTransactions$.next([
            ...remoteTransactions$.value,
            remoteMutationToTransaction(remoteMutation),
          ])
        } else {
          refreshEventsTrigger$.next()
        }
        return
      }
      if (version === 'published') {
        refreshEventsTrigger$.next()
        return
      }
      console.error('Unknown version', version)
    },
    [remoteTransactions$, refreshEventsTrigger$],
  )

  useRemoteMutations({
    client,
    documentId,
    documentType,
    onUpdate: onUpdate,
  })

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

  const revision$ = useMemo(
    () => getDocumentAtRevision({client, documentId, revisionId: rev}),
    [rev, client, documentId],
  )
  const revision = useObservable(revision$, null)

  const sinceId = useMemo(() => {
    if (since && since !== '@lastPublished') return since

    // We want to try to infer the since Id from the events, we want to compare to the last event that happened before the rev as fallback
    if (!events) return null
    if (!rev) {
      // rev has not been selected, the user will be seeing the last version of the document.
      // we need to select the event that comes after
      return events.slice(1).find((event) => 'revisionId' in event)?.revisionId || null
    }

    // If the user has a rev, we should show here the id of the event that is the previous event to the rev.
    const revisionEventIndex = events.findIndex(
      (event) => 'revisionId' in event && event.revisionId === rev,
    )
    if (revisionEventIndex === -1) {
      return null
    }

    return (
      events.slice(revisionEventIndex + 1).find((event) => 'revisionId' in event)?.revisionId ||
      null
    )
  }, [events, rev, since])

  const since$ = useMemo(
    () => getDocumentAtRevision({client, documentId, revisionId: sinceId}),
    [sinceId, client, documentId],
  )
  const sinceRevision = useObservable(since$, null)

  const findRangeForRevision = useCallback(
    (nextRev: string): [string | null, string | null] => {
      if (!events) return [null, null]
      if (!since) return [null, nextRev]
      const revisionIndex = events.findIndex((event) => event.id === nextRev)
      const sinceIndex = events.findIndex((event) => event.id === since)

      if (sinceIndex === -1 || revisionIndex === -1) return [null, nextRev]
      if (sinceIndex < revisionIndex) return [null, nextRev]
      if (sinceIndex === revisionIndex) return [null, nextRev]
      return [since, nextRev]
    },
    [events, since],
  )

  const findRangeForSince = useCallback(
    (nextSince: string): [string | null, string | null] => {
      if (!events) return [null, null]
      if (!rev) return [nextSince, null]
      const revisionIndex = events.findIndex((event) => event.id === rev)
      const sinceIndex = events.findIndex((event) => event.id === nextSince)
      if (sinceIndex === -1 || revisionIndex === -1) return [nextSince, null]
      if (sinceIndex < revisionIndex) return [nextSince, null]
      if (sinceIndex === revisionIndex) return [nextSince, null]
      return [nextSince, rev]
    },
    [events, rev],
  )

  const changesList = useCallback(
    ({to, from: fromDoc}: {to: SanityDocument; from: SanityDocument | null}) => {
      // TODO: We could pass here the remote edits to avoid fetching them again.
      // Consider using the remoteTransactions$ observable to get the remote edits.
      return getDocumentChanges({
        client,
        events,
        documentId,
        to,
        since: fromDoc,
      })
    },
    [client, events, documentId],
  )

  return {
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
