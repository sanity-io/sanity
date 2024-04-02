import {useMemoObservable} from 'react-rx'

import {useDocumentStore} from '../store/_legacy/datastores'
import {type OperationsAPI} from '../store/_legacy/document/document-pair/operations/types'

/** @internal */
export function useDocumentOperation(publishedDocId: string, docTypeName: string): OperationsAPI {
  const documentStore = useDocumentStore()
  return useMemoObservable(
    () => documentStore.pair.editOperations(publishedDocId, docTypeName),
    [docTypeName, documentStore.pair, publishedDocId],
  )!
}
