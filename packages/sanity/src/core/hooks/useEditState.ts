import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {debounce, merge, share, skip, take, timer} from 'rxjs'

import {type EditStateFor, useDocumentStore} from '../store'

/** @internal */
export function useEditState(
  publishedDocId: string,
  docTypeName: string,
  priority: 'default' | 'low' = 'default',
  version?: string | undefined,
): EditStateFor {
  if (version === 'published' || version === 'draft') {
    throw new Error('Version cannot be published or draft')
  }
  const documentStore = useDocumentStore()

  const observable = useMemo(() => {
    if (priority === 'low') {
      const base = documentStore.pair.editState(publishedDocId, docTypeName, version).pipe(share())

      return merge(
        base.pipe(take(1)),
        base.pipe(
          skip(1),
          debounce(() => timer(1000)),
        ),
      )
    }

    return documentStore.pair.editState(publishedDocId, docTypeName, version)
  }, [docTypeName, documentStore.pair, priority, publishedDocId, version])
  /**
   * We know that since the observable has a startWith operator, it will always emit a value
   * and that's why the non-null assertion is used here
   */
  return useObservable(observable)!
}
