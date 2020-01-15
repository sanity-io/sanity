import documentStore from 'part:@sanity/base/datastore/document'
import {toObservable, useObservable} from './utils/use-observable'
import {filter, mapTo, switchMap, switchMapTo, take} from 'rxjs/operators'
import {concat, of, Observable} from 'rxjs'

interface SyncState {
  isSyncing: boolean
}
const SYNCING = {isSyncing: true}
const NOT_SYNCING = {isSyncing: false}

export function useSyncState(publishedId, typeName): SyncState {
  return useObservable<SyncState>(
    toObservable([publishedId, typeName], props$ =>
      props$.pipe(
        switchMap(
          ([publishedId, typeName]): Observable<SyncState> => {
            const events$ = documentStore.local.documentEventsFor(publishedId, typeName)
            return events$.pipe(
              filter((ev: any) => ev.type === 'mutation' && ev.origin === 'local'),
              switchMapTo(
                concat(
                  of(SYNCING),
                  events$.pipe(
                    filter((ev: any) => ev.type === 'committed'),
                    take(1),
                    mapTo(NOT_SYNCING)
                  )
                )
              )
            )
          }
        )
      )
    ),
    NOT_SYNCING
  )
}
