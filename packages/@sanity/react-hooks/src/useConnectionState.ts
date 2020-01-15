import documentStore from 'part:@sanity/base/datastore/document'
import {toObservable, useObservable} from './utils/use-observable'
import {filter, mapTo, switchMap} from 'rxjs/operators'
import {merge, Observable} from 'rxjs'

interface SyncState {
  isConnected: boolean
}

const CONNECTED = {isConnected: true}
const DISCONNECTED = {isConnected: false}

export function useConnectionState(publishedId, typeName): SyncState {
  return useObservable<SyncState>(
    toObservable([publishedId, typeName], props$ =>
      props$.pipe(
        switchMap(
          ([publishedId, typeName]): Observable<SyncState> => {
            const events$ = documentStore.local.documentEventsFor(publishedId, typeName)
            const connected$ = events$.pipe(
              filter((ev: any) => ev.type !== 'reconnect'),
              mapTo(CONNECTED)
            )
            const disconnected$ = events$.pipe(
              filter((ev: any) => ev.type === 'reconnect'),
              mapTo(DISCONNECTED)
            )
            return merge(connected$, disconnected$)
          }
        )
      )
    ),
    DISCONNECTED
  )
}
