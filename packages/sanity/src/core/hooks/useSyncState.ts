import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {type Observable} from 'rxjs'
import {map} from 'rxjs/operators'

import {useDocumentStore} from '../store'
import {useDocumentTarget} from './useDocumentTarget'

/** @internal */
export interface SyncState {
  isSyncing: boolean
}

const SYNCING = {isSyncing: true}
const NOT_SYNCING = {isSyncing: false}

/** @internal */
export function useSyncState(
  publishedDocId: string,
  _documentType: string,
  _version?: string,
): SyncState {
  const documentStore = useDocumentStore()
  const documentTarget = useDocumentTarget(publishedDocId)
  const observable = useMemo(
    () =>
      documentStore.document
        .consistencyStatus(documentTarget)
        .pipe(map((isConsistent) => (isConsistent ? NOT_SYNCING : SYNCING))),
    [documentStore.document, documentTarget],
  )
  return useObservable<Observable<SyncState>>(observable, NOT_SYNCING)
}
