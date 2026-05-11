import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {debounce, distinctUntilChanged, merge, share, shareReplay, skip, take, timer} from 'rxjs'

import {type EditStateFor, useDocumentStore} from '../store'

// `editState.ts` allocates a fresh outer object per emission, but draft/published/
// version snapshot references are preserved upstream when contents are unchanged.
// Reference comparison on those + ready + transactionSyncLock is therefore enough
// and avoids a deep walk on large documents.
const isSameEditState = (prev: EditStateFor, next: EditStateFor): boolean =>
  prev.draft === next.draft &&
  prev.published === next.published &&
  prev.version === next.version &&
  prev.ready === next.ready &&
  prev.transactionSyncLock === next.transactionSyncLock

/** @internal */
export function useEditState(
  publishedDocId: string,
  docTypeName: string,
  priority: 'default' | 'low' = 'default',
  version?: string,
): EditStateFor {
  if (version === 'published' || version === 'draft') {
    throw new Error('Version cannot be published or draft')
  }
  const documentStore = useDocumentStore()

  const observable = useMemo(() => {
    const source = documentStore.pair.editState(publishedDocId, docTypeName, version)

    if (priority === 'low') {
      const base = source.pipe(share())

      return merge(
        base.pipe(take(1)),
        base.pipe(
          skip(1),
          debounce(() => timer(1000)),
        ),
      ).pipe(distinctUntilChanged(isSameEditState), shareReplay({bufferSize: 1, refCount: true}))
    }

    return source.pipe(
      distinctUntilChanged(isSameEditState),
      shareReplay({bufferSize: 1, refCount: true}),
    )
  }, [docTypeName, documentStore.pair, priority, publishedDocId, version])
  /**
   * We know that since the observable has a startWith operator, it will always emit a value
   * and that's why the non-null assertion is used here
   */
  return useObservable(observable)!
}
