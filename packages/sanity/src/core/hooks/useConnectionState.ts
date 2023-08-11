import {
  distinctUntilChanged,
  map,
  startWith,
  switchMap,
  filter,
  mergeWith,
  mapTo,
} from 'rxjs/operators'
import {of, timer, NEVER} from 'rxjs'
import {useMemoObservable} from 'react-rx'
import {ErrorStatus, useConnectionStatusStore, useDocumentStore} from '../store'

/** @internal */
export type ConnectionState = 'connecting' | 'reconnecting' | 'connected' | 'offline'

const INITIAL: ConnectionState = 'connecting'

/** @internal */
export function useConnectionState(publishedDocId: string, docTypeName: string): ConnectionState {
  const documentStore = useDocumentStore()
  const {connectionStatus$} = useConnectionStatusStore()

  return useMemoObservable(
    () => {
      const documentEvents$ = documentStore.pair.documentEvents(publishedDocId, docTypeName).pipe(
        map((ev: {type: string}) => ev.type),
        map((eventType) => eventType !== 'reconnect'),
        switchMap((isConnected) =>
          isConnected ? of('connected') : timer(200).pipe(mapTo('reconnecting'))
        )
      )

      const connectionStatusUpdate$ = connectionStatus$.pipe(
        filter((status): status is ErrorStatus => status.type === 'error'),
        map((status) => (status.isOffline ? 'offline' : NEVER))
      )

      return documentEvents$
        .pipe(mergeWith(connectionStatusUpdate$))
        .pipe(startWith(INITIAL as any), distinctUntilChanged())
    },
    [documentStore.pair, connectionStatus$, publishedDocId, docTypeName],
    INITIAL
  )
}
