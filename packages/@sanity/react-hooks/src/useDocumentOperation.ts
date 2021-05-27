import documentStore from 'part:@sanity/base/datastore/document'
import {useMemoObservable} from 'react-rx'

export function useDocumentOperation(publishedDocId: string, docTypeName: string) {
  return useMemoObservable(() => documentStore.pair.editOperations(publishedDocId, docTypeName), [
    publishedDocId,
    docTypeName,
  ])
}
