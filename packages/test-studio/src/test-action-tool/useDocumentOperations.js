import React from 'react'
import documentStore from 'part:@sanity/base/datastore/document'

import {useObservable} from '../actions/hooks'
export function useDocumentOperations(publishedId, typeName) {
  return useObservable(() => documentStore.local.editOpsOf(publishedId, typeName), null, [
    publishedId,
    typeName
  ])
}
