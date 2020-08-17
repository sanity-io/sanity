import documentStore from 'part:@sanity/base/datastore/document'
import {Observable} from 'rxjs'
import {map, switchMap, distinctUntilChanged} from 'rxjs/operators'
import {toObservable, useObservable} from './utils/useObservable'

interface SyncState {
  isSyncing: boolean
}

const SYNCING = {isSyncing: true}
const NOT_SYNCING = {isSyncing: false}

export function useSyncState(publishedId: string): SyncState {
  return useObservable<SyncState>(
    toObservable(publishedId, props$ =>
      props$.pipe(
        distinctUntilChanged(),
        switchMap(
          (publishedDocId): Observable<SyncState> => {
            return documentStore.pair
              .consistencyStatus(publishedDocId)
              .pipe(map(isConsistent => (isConsistent ? NOT_SYNCING : SYNCING)))
          }
        )
      )
    ),
    NOT_SYNCING
  )
}
