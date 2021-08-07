// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import documentStore from 'part:@sanity/base/datastore/document'
import {useMemoObservable} from 'react-rx'

export function useDocumentOperationEvent(publishedDocId: string, docTypeName: string) {
  return useMemoObservable(() => documentStore.pair.operationEvents(publishedDocId, docTypeName), [
    publishedDocId,
    docTypeName,
  ])
}
