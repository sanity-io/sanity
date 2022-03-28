import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {useDatastores} from '../datastores'
import {OperationsAPI} from '../datastores/document/document-pair/operations'

export function useDocumentOperation(publishedDocId: string, docTypeName: string): OperationsAPI {
  const {documentStore} = useDatastores()

  const operations$ = useMemo(() => {
    return documentStore.pair.editOperations(publishedDocId, docTypeName)
  }, [documentStore, publishedDocId, docTypeName])

  return useObservable(operations$)!
}
