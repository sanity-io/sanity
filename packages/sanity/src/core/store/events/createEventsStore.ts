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
  serverActionsEnabled: Observable<boolean>
  isLiveEdit: boolean
}

/**
 * Creates an event store for a document.
 * If you want to use this in a React component, consider using `useEventsStore` instead.
 *
 * Consider subscribing the remoteEventsListener to get updates on remote transactions.
 */
export function createEventsStore({
  client,
  documentId,
  documentType,
  releases$,
  serverActionsEnabled,
  isLiveEdit,
}: EventsStoreOptions) {
  const initialEvents = getInitialFetchEvents({client, documentId})
  const {expandedEvents$, handleExpandEvent} = getExpandEvents({client, documentId})
  const {remoteEdits$, remoteTransactions$, subscribe} = getRemoteTransactionsSubscription({
    client,
    documentId,
    documentType,
    isLiveEdit,
    serverActionsEnabled,
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
