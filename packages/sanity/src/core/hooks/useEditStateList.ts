import {useMemoObservable} from 'react-rx'
import {combineLatest} from 'rxjs'

import {type EditStateFor, useDocumentStore} from '../store'

/** @internal */
export function useEditStateList(publishedDocIds: string[], docTypeName: string): EditStateFor[] {
  const documentStore = useDocumentStore()
  return useMemoObservable(() => {
    return combineLatest(
      publishedDocIds.map((publishedDocId) =>
        documentStore.pair.editState(publishedDocId, docTypeName),
      ),
    )
  }, [documentStore.pair, publishedDocIds, docTypeName]) as EditStateFor[]
}
