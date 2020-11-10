import documentStore from 'part:@sanity/base/datastore/document'
import {useObservable} from './utils/useObservable'
import React from 'react'

export function useEditState(publishedDocId: string, docTypeName: string) {
  return useObservable(
    React.useMemo(() => documentStore.pair.editState(publishedDocId, docTypeName), [
      publishedDocId,
      docTypeName,
    ])
  )
}
