import {useMemoObservable} from 'react-rx'

import {type OperationsAPI, useDocumentStore} from '../store'

/** @internal */
export function useDocumentOperation(publishedDocId: string, docTypeName: string): OperationsAPI {
  const documentStore = useDocumentStore()
  return useMemoObservable(
    () => documentStore.pair.editOperations(publishedDocId, docTypeName),
    [docTypeName, documentStore.pair, publishedDocId],
  )!
}
