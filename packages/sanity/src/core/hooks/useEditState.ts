import {useMemoObservable} from 'react-rx'
import {debounce, merge, share, skip, take, timer} from 'rxjs'

import {type EditState, useDocumentStore} from '../store'

/** @internal */
export function useEditState(
  publishedDocId: string,
  docTypeName: string,
  priority: 'default' | 'low' = 'default',
): EditState {
  const documentStore = useDocumentStore()

  return useMemoObservable(() => {
    if (priority === 'low') {
      const base = documentStore.pair.editState(publishedDocId, docTypeName).pipe(share())

      return merge(
        base.pipe(take(1)),
        base.pipe(
          skip(1),
          debounce(() => timer(1000)),
        ),
      )
    }

    return documentStore.pair.editState(publishedDocId, docTypeName)
  }, [documentStore.pair, publishedDocId, docTypeName, priority]) as EditState
}
