import {useMemoObservable} from 'react-rx'
import {merge, timer} from 'rxjs'
import {debounce, share, skip, take} from 'rxjs/operators'
import {EditStateFor, useDocumentStore} from '../store'

/** @internal */
export function useEditState(
  publishedDocId: string,
  docTypeName: string,
  priority: 'default' | 'low' = 'default',
): EditStateFor {
  const documentStore = useDocumentStore()

  return useMemoObservable(() => {
    const base = documentStore.pair.editState(publishedDocId, docTypeName).pipe(share())
    if (priority === 'low') {
      return merge(
        base.pipe(take(1)),
        base.pipe(
          skip(1),
          debounce(() => timer(1000)),
        ),
      )
    }
    return documentStore.pair.editState(publishedDocId, docTypeName)
  }, [documentStore.pair, publishedDocId, docTypeName, priority]) as EditStateFor
}
