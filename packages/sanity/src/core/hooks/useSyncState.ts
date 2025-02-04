import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {type Observable} from 'rxjs'
import {map} from 'rxjs/operators'

import {useDocumentStore} from '../store'

/** @internal */
export interface SyncState {
  isSyncing: boolean
}

const SYNCING = {isSyncing: true}
const NOT_SYNCING = {isSyncing: false}

/** @internal */
export function useSyncState(
  publishedDocId: string,
  documentType: string,
  version?: string,
): SyncState {
  const documentStore = useDocumentStore()

  const observable = useMemo(
    () =>
      documentStore.pair
        .consistencyStatus(publishedDocId, documentType, version)
        .pipe(map((isConsistent) => (isConsistent ? NOT_SYNCING : SYNCING))),
    [documentStore.pair, documentType, publishedDocId, version],
  )
  return useObservable<Observable<SyncState>>(observable, NOT_SYNCING)
}
