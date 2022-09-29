import {useMemoObservable} from 'react-rx'
import {map} from 'rxjs/operators'
import {useDocumentStore} from '../store'

/** @internal */
export interface SyncState {
  isSyncing: boolean
}

const SYNCING = {isSyncing: true}
const NOT_SYNCING = {isSyncing: false}

/** @internal */
export function useSyncState(publishedDocId: string, documentType: string): SyncState {
  const documentStore = useDocumentStore()

  return useMemoObservable<SyncState>(
    () =>
      documentStore.pair
        .consistencyStatus(publishedDocId, documentType)
        .pipe(map((isConsistent) => (isConsistent ? NOT_SYNCING : SYNCING))),
    [publishedDocId],
    NOT_SYNCING
  )
}
