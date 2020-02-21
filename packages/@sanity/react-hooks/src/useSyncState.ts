import documentStore from 'part:@sanity/base/datastore/document'
import {toObservable, useObservable} from './utils/use-observable'
import {map, switchMap, distinctUntilChanged} from 'rxjs/operators'
import {Observable} from 'rxjs'

interface SyncState {
  isSyncing: boolean
}

const SYNCING = {isSyncing: true}
const NOT_SYNCING = {isSyncing: false}

export function useSyncState(publishedId, typeName): SyncState {
  return useObservable<SyncState>(
    toObservable(publishedId, props$ =>
      props$.pipe(
        distinctUntilChanged(),
        switchMap(
          (publishedId): Observable<SyncState> => {
            return documentStore.pair
              .consistencyStatus(publishedId)
              .pipe(map(isConsistent => (isConsistent ? NOT_SYNCING : SYNCING)))
          }
        )
      )
    ),
    NOT_SYNCING
  )
}
