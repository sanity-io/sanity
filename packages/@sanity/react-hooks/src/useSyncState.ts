import documentStore from 'part:@sanity/base/datastore/document'
import {useObservable} from './utils/use-observable'
import {map} from 'rxjs/operators'
import React from 'react'

interface SyncState {
  isSyncing: boolean
}

const SYNCING = {isSyncing: true}
const NOT_SYNCING = {isSyncing: false}

export function useSyncState(publishedId, typeName): SyncState {
  return useObservable<SyncState>(
    React.useMemo(
      () =>
        documentStore.pair
          .consistencyStatus(publishedId)
          .pipe(map(isConsistent => (isConsistent ? NOT_SYNCING : SYNCING))),
      [publishedId]
    ),
    NOT_SYNCING
  )
}
