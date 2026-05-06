import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {useDocumentStore} from '../store'
import {useDocumentTarget} from './useDocumentTarget'

/** @internal */
export function useDocumentOperationEvent(publishedDocId: string, docTypeName: string) {
  const documentStore = useDocumentStore()
  const documentTarget = useDocumentTarget(publishedDocId)
  const observable = useMemo(
    () => documentStore.document.operationEvents(documentTarget, docTypeName),
    [documentTarget, documentStore.document, docTypeName],
  )
  return useObservable(observable)
}
