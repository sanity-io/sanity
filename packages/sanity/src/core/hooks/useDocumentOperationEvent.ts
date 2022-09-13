import {useMemoObservable} from 'react-rx'
import {useDocumentStore} from '../store'

export function useDocumentOperationEvent(publishedDocId: string, docTypeName: string) {
  const documentStore = useDocumentStore()

  return useMemoObservable(
    () => documentStore.pair.operationEvents(publishedDocId, docTypeName),
    [publishedDocId, docTypeName]
  )
}
