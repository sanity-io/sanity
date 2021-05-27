import documentStore from 'part:@sanity/base/datastore/document'
import {useMemoObservable} from 'react-rx'

export function useEditState(publishedDocId: string, docTypeName: string) {
  return useMemoObservable(() => documentStore.pair.editState(publishedDocId, docTypeName), [
    publishedDocId,
    docTypeName,
  ])
}
