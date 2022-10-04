import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {useDocumentStore} from '../../_unstable/datastores'
import {OperationsAPI} from '../../_unstable/datastores/document/document-pair/operations'

export function useDocumentOperation(publishedDocId: string, docTypeName: string): OperationsAPI {
  const documentStore = useDocumentStore()

  const operations$ = useMemo(() => {
    return documentStore.pair.editOperations(publishedDocId, docTypeName)
  }, [documentStore, publishedDocId, docTypeName])

  return useObservable(operations$)!
}
