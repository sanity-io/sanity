import documentStore from 'part:@sanity/base/datastore/document'
import {useObservable} from './utils/useObservable'
import React from 'react'

export function useDocumentOperationEvent(publishedDocId: string, docTypeName: string) {
  return useObservable(
    React.useMemo(() => documentStore.pair.operationEvents(publishedDocId, docTypeName), [
      publishedDocId,
      docTypeName,
    ])
  )
}
