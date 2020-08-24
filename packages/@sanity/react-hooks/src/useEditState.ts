import documentStore from 'part:@sanity/base/datastore/document'
import {useObservable} from './utils/use-observable'
import React from 'react'

export function useEditState(publishedId, typeName) {
  return useObservable(
    React.useMemo(() => documentStore.pair.editState(publishedId, typeName), [
      publishedId,
      typeName
    ])
  )
}
