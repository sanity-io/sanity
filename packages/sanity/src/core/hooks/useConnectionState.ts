import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {type Observable, of, timer} from 'rxjs'
import {distinctUntilChanged, map, mapTo, startWith, switchMap} from 'rxjs/operators'

import {type DocumentStore, useDocumentStore} from '../store'

/** @internal */
export type ConnectionState = 'connecting' | 'reconnecting' | 'connected'

const INITIAL: ConnectionState = 'connecting'

/**
 * The realtime connection state for a document, derived from its listener
 * events. Extracted so it can be combined with other document streams
 * (see `useDocumentSyncState`) without re-subscribing through the hook.
 *
 * @internal
 */
export function connectionState(
  documentStore: DocumentStore,
  publishedDocId: string,
  docTypeName: string,
  version?: string,
): Observable<ConnectionState> {
  return documentStore.pair.documentEvents(publishedDocId, docTypeName, version).pipe(
    map((ev: {type: string}) => ev.type),
    map((eventType) => eventType !== 'reconnect'),
    switchMap((isConnected) =>
      isConnected ? of('connected') : timer(200).pipe(mapTo('reconnecting')),
    ),
    startWith(INITIAL as any),
    distinctUntilChanged(),
  )
}

/** @internal */
export function useConnectionState(
  publishedDocId: string,
  docTypeName: string,
  version?: string,
): ConnectionState {
  const documentStore = useDocumentStore()

  const observable = useMemo(
    () => connectionState(documentStore, publishedDocId, docTypeName, version),
    [docTypeName, documentStore, publishedDocId, version],
  )
  return useObservable(observable, INITIAL)
}
