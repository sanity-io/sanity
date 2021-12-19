import {useMemoObservable} from 'react-rx'
import {map} from 'rxjs/operators'
import {useDatastores} from '../datastores'

interface SyncState {
  isSyncing: boolean
}

const SYNCING = {isSyncing: true}
const NOT_SYNCING = {isSyncing: false}

export function useSyncState(publishedDocId: string, documentType: string): SyncState {
  const {documentStore} = useDatastores()

  return useMemoObservable<SyncState>(
    () =>
      documentStore.pair
        .consistencyStatus(publishedDocId, documentType)
        .pipe(map((isConsistent) => (isConsistent ? NOT_SYNCING : SYNCING))),
    [publishedDocId],
    NOT_SYNCING
  )
}
