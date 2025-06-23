import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {useDocumentStore} from '../store'
import {
  type OperationError,
  type OperationSuccess,
} from '../store/_legacy/document/document-pair/operationEvents'

/** @internal */
export function useDocumentOperationEvent(
  publishedDocId: string,
  docTypeName: string,
): OperationSuccess | OperationError | undefined {
  const documentStore = useDocumentStore()

  const observable = useMemo(
    () => documentStore.pair.operationEvents(publishedDocId, docTypeName),
    [docTypeName, documentStore.pair, publishedDocId],
  )
  return useObservable(observable)
}
