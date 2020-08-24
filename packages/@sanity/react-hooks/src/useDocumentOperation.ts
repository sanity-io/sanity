import React from 'react'
import documentStore from 'part:@sanity/base/datastore/document'
import {useObservable} from './utils/use-observable'

export function useDocumentOperation(publishedId, typeName) {
  return useObservable(
    React.useMemo(() => documentStore.pair.editOperations(publishedId, typeName), [
      publishedId,
      typeName
    ])
  )
}
