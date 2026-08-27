import {type SanityClient} from '@sanity/client'
import {type Observable} from 'rxjs'

import {type useReleasesStore} from '../../releases/store/useReleasesStore'
import {createEventsObservable} from './createEventsObservable'
import {getDocumentChanges} from './getDocumentChanges'
import {getExpandEvents} from './getExpandEvents'
import {getInitialFetchEvents} from './getInitialFetchEvents'
import {getRemoteTransactionsSubscription} from './getRemoteTransactionsSubscription'
import {type EventsStoreRevision} from './types'

interface EventsStoreOptions {
  client: SanityClient
  documentId: string
  documentType: string
  releases$: ReturnType<typeof useReleasesStore>['state$']
  isLiveEdit: boolean
}

/**
 * Creates the (non-React) events store for a document variant, wiring together:
 * - `getInitialFetchEvents`: fetching/paginating events + synthesizing edit events,
 * - `getExpandEvents`: on-demand expansion of publish/delete events,
 * - `getRemoteTransactionsSubscription`: real-time remote mutations (append or trigger refetch),
 * - `createEventsObservable`: merge, sort and per-variant post-processing.
 *
 * Returns:
 * - `eventsObservable$`: the final `{events, nextCursor, loading, error}` stream for the UI.
 * - `getDocumentChanges(revision$, since$)`: annotated diff stream between two revisions.
 * - `handleExpandEvent`, `loadMoreEvents`, `reloadEvents`: imperative actions.
 * - `remoteTransactionsListener`: call to activate the remote listener; returns the subscription
 *   (the caller owns unsubscription — `useEventsStore` ties it to the component lifecycle).
 *
 * If you want to use this in a React component, use `useEventsStore` instead.
 */
export function createEventsStore({
  client,
  documentId,
  documentType,
  releases$,
  isLiveEdit,
}: EventsStoreOptions) {
  const initialEvents = getInitialFetchEvents({client, documentId})
  const {expandedEvents$, handleExpandEvent} = getExpandEvents({client, documentId})
  const {remoteEdits$, remoteTransactions$, subscribe} = getRemoteTransactionsSubscription({
    client,
    documentId,
    documentType,
    isLiveEdit,
    onRefetch: initialEvents.reloadEvents,
  })
  const eventsObservable$ = createEventsObservable({
    documentId,
    events$: initialEvents.events$,
    remoteEdits$,
    expandedEvents$,
    releases$,
  })

  return {
    eventsObservable$,
    getDocumentChanges: (
      revision$: Observable<EventsStoreRevision | null>,
      since$: Observable<EventsStoreRevision | null>,
    ) => {
      return getDocumentChanges({
        client,
        eventsObservable$: eventsObservable$,
        documentId,
        remoteTransactions$,
        to$: revision$,
        since$: since$,
      })
    },
    handleExpandEvent: handleExpandEvent,
    loadMoreEvents: initialEvents.loadMore,
    reloadEvents: initialEvents.reloadEvents,
    remoteTransactionsListener: subscribe,
  }
}
