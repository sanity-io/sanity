import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {debounce, merge, share, skip, take, timer} from 'rxjs'

import {type EditStateFor, useDocumentStore} from '../store'

/** @internal */
export function useEditState(
  publishedDocId: string,
  docTypeName: string,
  priority: 'default' | 'low' = 'default',
): EditStateFor {
  const documentStore = useDocumentStore()

  const observable = useMemo(() => {
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
  }, [docTypeName, documentStore.pair, priority, publishedDocId])
  /**
   * We know that since the observable has a startWith operator, it will always emit a value
   * and that's why the non-null assertion is used here
   */
  return useObservable(observable)!
}
