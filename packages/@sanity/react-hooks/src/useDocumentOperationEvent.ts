import documentStore from 'part:@sanity/base/datastore/document'
import {useObservable} from './utils/use-observable'
import React from 'react'

export function useDocumentOperationEvent(publishedId, typeName) {
  return useObservable(
    React.useMemo(() => documentStore.pair.operationEvents(publishedId, typeName), [
      publishedId,
      typeName
    ])
  )
}
