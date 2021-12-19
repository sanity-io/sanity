import {useMemoObservable} from 'react-rx'
import {useDatastores} from '../datastores'

export function useDocumentOperationEvent(publishedDocId: string, docTypeName: string) {
  const {documentStore} = useDatastores()

  return useMemoObservable(
    () => documentStore.pair.operationEvents(publishedDocId, docTypeName),
    [publishedDocId, docTypeName]
  )
}
