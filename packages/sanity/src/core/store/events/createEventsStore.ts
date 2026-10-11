import {type SanityClient} from '@sanity/client'
import {type Observable, of, Subscription} from 'rxjs'

import {createEventsObservable} from './createEventsObservable'
import {getDocumentChanges} from './getDocumentChanges'
import {getExpandEvents} from './getExpandEvents'
import {getInitialFetchEvents} from './getInitialFetchEvents'
import {getRemoteTransactionsSubscription} from './getRemoteTransactionsSubscription'
import {type EventsStoreRevision} from './types'

interface EventsStoreOptions {
  client: SanityClient
  documentId: string | undefined
  documentType: string
  isLiveEdit: boolean
}

const IDLE_EVENTS = {events: [], nextCursor: '', loading: false, error: null}

/**
 * Idle store used when there is no document to observe (e.g. a missing variant with no
 * creatable target). No events, translog, or history requests are made.
 */
function createIdleEventsStore() {
  const eventsObservable$ = of(IDLE_EVENTS)
  return {
    eventsObservable$,
    getDocumentChanges: () => of({diff: null, loading: false, error: null}),
    handleExpandEvent: async () => {},
    loadMoreEvents: () => {},
    reloadEvents: () => {},
    remoteTransactionsListener: () => new Subscription(),
  }
}

/**
 * Creates the (non-React) events store for a document variant, wiring together:
 * - `getInitialFetchEvents`: fetching/paginating events + synthesizing edit events,
 * - `getExpandEvents`: on-demand expansion of publish/delete events,
 * - `getRemoteTransactionsSubscription`: real-time remote mutations (append or trigger refetch),
 * - `createEventsObservable`: merge, sort and per-variant post-processing.
 *
 * When `documentId` is missing, returns an idle store (`events: []`, `loading: false`) and does
 * not subscribe to the document pair or hit the events/history APIs.
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
  isLiveEdit,
}: EventsStoreOptions) {
  if (!documentId) {
    return createIdleEventsStore()
  }

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
