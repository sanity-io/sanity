import documentStore from 'part:@sanity/base/datastore/document'
import {useMemoObservable} from 'react-rx'

export function useDocumentOperationEvent(publishedDocId: string, docTypeName: string) {
  return useMemoObservable(() => documentStore.pair.operationEvents(publishedDocId, docTypeName), [
    publishedDocId,
    docTypeName,
  ])
}
