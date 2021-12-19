import {useMemoObservable} from 'react-rx'
import {useDatastores} from '../datastores'
import {OperationsAPI} from '../datastores/document/document-pair/operations'

export function useDocumentOperation(publishedDocId: string, docTypeName: string): OperationsAPI {
  const {documentStore} = useDatastores()

  return useMemoObservable(
    () => documentStore.pair.editOperations(publishedDocId, docTypeName),
    [publishedDocId, docTypeName]
  )!
}
