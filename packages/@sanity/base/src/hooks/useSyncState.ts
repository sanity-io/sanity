// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import documentStore from 'part:@sanity/base/datastore/document'
import {useMemoObservable} from 'react-rx'
import {map} from 'rxjs/operators'

interface SyncState {
  isSyncing: boolean
}

const SYNCING = {isSyncing: true}
const NOT_SYNCING = {isSyncing: false}

export function useSyncState(publishedDocId: string, documentType: string): SyncState {
  return useMemoObservable<SyncState>(
    () =>
      documentStore.pair
        .consistencyStatus(publishedDocId, documentType)
        .pipe(map((isConsistent) => (isConsistent ? NOT_SYNCING : SYNCING))),
    [publishedDocId],
    NOT_SYNCING
  )
}
