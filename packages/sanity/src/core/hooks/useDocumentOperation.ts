import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {type OperationsAPI, useDocumentStore} from '../store'

/** @internal */
export function useDocumentOperation(
  publishedDocId: string,
  docTypeName: string,
  version?: string,
): OperationsAPI {
  const documentStore = useDocumentStore()
  const observable = useMemo(
    () => documentStore.pair.editOperations(publishedDocId, docTypeName, version),
    [docTypeName, documentStore.pair, publishedDocId, version],
  )
  /**
   * We know that since the observable has a startWith operator, it will always emit a value
   * and that's why the non-null assertion is used here
   */
  return useObservable(observable)!
}
