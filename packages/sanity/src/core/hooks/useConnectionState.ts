import {useMemo} from 'react'
import {useSyncObservable} from 'react-rx'
import {type Observable, of, type OperatorFunction, timer} from 'rxjs'
import {distinctUntilChanged, filter, map, mapTo, startWith, switchMap} from 'rxjs/operators'

import {useDocumentStore} from '../store/datastores'
import {type DocumentStore} from '../store/document/document-store'

/** @internal */
export type ConnectionState = 'connecting' | 'reconnecting' | 'connected'

const INITIAL: ConnectionState = 'connecting'

// The events the document's listener opens a connection with, and the one it loses it with.
const CONNECTION_EVENT_TYPES = new Set(['welcome', 'welcomeback', 'reset', 'reconnect'])

/**
 * Derives the connection state from a document's events. Only the listener's connection events
 * count: the document's snapshots also load while the listener is down, so a snapshot says
 * nothing about whether the document is live.
 *
 * @internal
 */
export function toConnectionState(): OperatorFunction<{type: string}, ConnectionState> {
  return (events$) =>
    events$.pipe(
      filter((event) => CONNECTION_EVENT_TYPES.has(event.type)),
      map((event) => event.type !== 'reconnect'),
      switchMap((isConnected): Observable<ConnectionState> =>
        // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
        isConnected ? of('connected') : timer(200).pipe(mapTo('reconnecting')),
      ),
      startWith(INITIAL),
      distinctUntilChanged(),
    )
}

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
  return documentStore.pair
    .documentEvents(publishedDocId, docTypeName, version)
    .pipe(toConnectionState())
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
  // Kept synchronous: `useDocumentForm` gates the form's `ready` / `readOnly`
  // state on this (a `reconnecting` connection makes the editor read-only), so
  // a deferred value could leave the editor writable while reconnecting.
  return useSyncObservable(observable, INITIAL)
}
