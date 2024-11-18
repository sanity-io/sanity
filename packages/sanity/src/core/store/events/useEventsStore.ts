import {useCallback, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {combineLatest, type Observable, of} from 'rxjs'
import {catchError, map, startWith, tap} from 'rxjs/operators'
import {getVersionFromId, type SanityClient, type SanityDocument} from 'sanity'

import {useClient} from '../../hooks'
import {useReleasesStore} from '../../releases/store/useReleasesStore'
import {getReleaseIdFromName} from '../../releases/util/getReleaseIdFromName'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'
import {getDocumentChanges} from './getDocumentChanges'
import {type DocumentGroupEvent, type EventsStore, type EventsStoreRevision} from './types'

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

export function useEventsStore({
  documentId,
  rev,
  since,
}: {
  documentId: string
  rev?: string
  since?: string
}): EventsStore {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const {state$} = useReleasesStore()

  const eventsObservable$: Observable<{
    events: DocumentGroupEvent[]
    nextCursor: string
    loading: boolean
    error: null | Error
  }> = useMemo(() => {
    const params = new URLSearchParams({
      // This is not working yet, CL needs to fix it.
      limit: '2',
    })
    return client.observable
      .request<{
        events: Record<string, DocumentGroupEvent[]>
        nextCursor: string
      }>({
        url: `/data/events/${client.config().dataset}/documents/${documentId}?${params.toString()}`,
        tag: 'get-document-events',
      })
      .pipe(
        map((response) => {
          console.log('response', response)
          return {
            events: response.events[documentId] || [],
            nextCursor: response.nextCursor,
            loading: false,
            error: null,
          }
        }),
        catchError((error: Error) => {
          console.error('Error fetching events', error)
          return [{events: [], nextCursor: '', loading: false, error: error}]
        }),
        startWith({events: [], nextCursor: '', loading: true, error: null}),
      )
  }, [client, documentId])

  const observable$ = useMemo(() => {
    return combineLatest([state$, eventsObservable$]).pipe(
      map(([releases, {events, nextCursor, loading, error}]) => {
        return {
          events: events.map((event) => {
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
  }, [state$, eventsObservable$])

  const {events, loading, error, nextCursor} = useObservable(observable$, INITIAL_VALUE)

  const revision$ = useMemo(
    () =>
      getDocumentAtRevision({
        client,
        documentId,
        revisionId: rev,
      }),
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
      const revisionIndex = events.findIndex(
        (event) => 'revisionId' in event && event.revisionId === nextRev,
      )
      const sinceIndex = events.findIndex(
        (event) => 'revisionId' in event && event.revisionId === since,
      )

      if (sinceIndex === -1 || revisionIndex === -1) return [null, nextRev]
      if (sinceIndex > revisionIndex) return [null, nextRev]
      return [since, nextRev]
    },
    [events, since],
  )

  const findRangeForSince = useCallback(
    (nextSince: string): [string | null, string | null] => {
      if (!events) return [null, null]
      if (!rev) return [nextSince, null]
      const revisionIndex = events.findIndex(
        (event) => 'revisionId' in event && event.revisionId === rev,
      )
      const sinceIndex = events.findIndex(
        (event) => 'revisionId' in event && event.revisionId === nextSince,
      )
      if (sinceIndex === -1 || revisionIndex === -1) return [nextSince, null]
      if (sinceIndex < revisionIndex) return [nextSince, null]
      return [nextSince, rev]
    },
    [events, rev],
  )

  const changesList = useCallback(
    ({to, from}: {to: SanityDocument; from: SanityDocument | null}) => {
      return getDocumentChanges({
        client,
        events,
        documentId,
        to,
        since: from,
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
