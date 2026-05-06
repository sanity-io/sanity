import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {useDocumentStore} from '../store'
import {type DocumentOperationsAPI} from '../store/document/document/operations/types'
import {useDocumentOperationWithComlinkHistory} from './useDocumentOperationWithComlinkHistory'
import {useDocumentTarget} from './useDocumentTarget'

/** @internal */
export function useDocumentOperation(
  publishedDocId: string,
  docTypeName: string,
  _version?: string,
): DocumentOperationsAPI {
  const documentStore = useDocumentStore()
  const documentTarget = useDocumentTarget(publishedDocId)
  const observable = useMemo(
    () => documentStore.document.editOperations(documentTarget, docTypeName),
    [docTypeName, documentStore.document, documentTarget],
  )

  /**
   * We know that since the observable has a startWith operator, it will always emit a value
   * and that's why the non-null assertion is used here
   */
  const api = useObservable(observable)!

  return useDocumentOperationWithComlinkHistory({
    api,
    docTypeName,
    publishedDocId,
  })
}
