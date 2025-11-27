import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {type OperationError, type OperationSuccess, useDocumentStore} from '../store'

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
