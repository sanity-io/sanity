import {useMemoObservable} from 'react-rx'
import {useDocumentStore} from '../store'

/** @internal */
export function useDocumentOperationEvent(publishedDocId: string, docTypeName: string) {
  const documentStore = useDocumentStore()

  return useMemoObservable(
    () => documentStore.pair.operationEvents(publishedDocId, docTypeName),
    [documentStore.pair, publishedDocId, docTypeName]
  )
}
