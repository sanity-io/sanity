import documentStore from 'part:@sanity/base/datastore/document'
import {useObservable} from './utils/useObservable'
import {map} from 'rxjs/operators'
import React from 'react'

interface SyncState {
  isSyncing: boolean
}

const SYNCING = {isSyncing: true}
const NOT_SYNCING = {isSyncing: false}

export function useSyncState(publishedDocId: string): SyncState {
  return useObservable<SyncState>(
    React.useMemo(
      () =>
        documentStore.pair
          .consistencyStatus(publishedDocId)
          .pipe(map((isConsistent) => (isConsistent ? NOT_SYNCING : SYNCING))),
      [publishedDocId]
    ),
    NOT_SYNCING
  )
}
