import {useMemo} from 'react'
import {useSyncObservable} from 'react-rx'

import {useDocumentStore} from '../store/datastores'

/** @internal */
export function useDocumentOperationEvent(publishedDocId: string, docTypeName: string) {
  const documentStore = useDocumentStore()

  const observable = useMemo(
    () => documentStore.pair.operationEvents(publishedDocId, docTypeName),
    [docTypeName, documentStore.pair, publishedDocId],
  )
  // Kept synchronous: this is an event stream driving effects (toasts,
  // pane-close). Deferring could coalesce a quick success/error sequence into
  // one render and drop an event consumers must react to.
  return useSyncObservable(observable, undefined)
}
