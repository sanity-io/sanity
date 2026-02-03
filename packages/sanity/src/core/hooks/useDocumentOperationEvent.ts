import {useDocumentStore} from '../store'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'

/** @internal */
export function useDocumentOperationEvent(publishedDocId: string, docTypeName: string) {
  const documentStore = useDocumentStore()

  const observable = useMemo(
    () => documentStore.pair.operationEvents(publishedDocId, docTypeName),
    [docTypeName, documentStore.pair, publishedDocId],
  )
  return useObservable(observable)
}
