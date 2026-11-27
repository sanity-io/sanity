import {type SanityClient} from '@sanity/client'
import {combineLatest, map, type Observable, of, shareReplay, Subscription} from 'rxjs'

import {createEventsObservable} from './createEventsObservable'
import {getDocumentChanges} from './getDocumentChanges'
import {createEditChanges, getTransactionChains} from './getEditChanges'
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
    getEditChanges: () => of({diff: null, loading: false, error: null}),
    handleExpandEvent: async () => {},
    loadMoreEvents: () => {},
    reloadEvents: () => {},
    remoteTransactionsListener: () => new Subscription(),
  }
}

/**
 * Creates the (non-React) events store for a document variant, wiring together:
 * - `getInitialFetchEvents`: fetching/paginating events + synthesizing edit events,
 * - `getExpandEvents`: on-demand expansion of publish/delete events, and freezing of expanded
 *   edit groups,
 * - `getRemoteTransactionsSubscription`: real-time remote mutations (append or trigger refetch),
 * - `createEventsObservable`: merge, sort and per-variant post-processing.
 *
 * When `documentId` is missing, returns an idle store (`events: []`, `loading: false`) and does
 * not subscribe to the document pair or hit the events/history APIs.
 *
 * Returns:
 * - `eventsObservable$`: the final `{events, nextCursor, loading, error}` stream for the UI.
 * - `getDocumentChanges(revision$, since$)`: annotated diff stream between two revisions.
 * - `getEditChanges({fromRevisionId, toRevisionId})`: what a range of edit transactions changed,
 *   rebuilt from the transactions fetched for the events and the live document (see
 *   `createEditChanges`).
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
  const {expandedEvents$, expandedTransactions$, frozenEditGroups$, handleExpandEvent} =
    getExpandEvents({client, documentId})
  const {remoteEdits$, remoteTransactions$, remoteTransactionsStartRev$, liveDocument$, subscribe} =
    getRemoteTransactionsSubscription({
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
    frozenEditGroups$,
  })
  const transactionChains$ = combineLatest([
    initialEvents.editTransactions$,
    remoteTransactions$,
    remoteTransactionsStartRev$,
    expandedTransactions$,
  ]).pipe(
    map(([fetched, remote, remoteStartRev, expanded]) =>
      getTransactionChains({fetched, remote, remoteStartRev, expanded}),
    ),
    shareReplay({bufferSize: 1, refCount: true}),
  )

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
    getEditChanges: createEditChanges({
      client,
      documentId,
      chains$: transactionChains$,
      liveDocument$,
    }),
    handleExpandEvent: handleExpandEvent,
    loadMoreEvents: initialEvents.loadMore,
    reloadEvents: initialEvents.reloadEvents,
    remoteTransactionsListener: subscribe,
  }
}
