import {useMemo} from 'react'
import {useSyncObservable} from 'react-rx'
import {debounce, distinctUntilChanged, merge, share, shareReplay, skip, take, timer} from 'rxjs'

import {useDocumentStore} from '../store/datastores'
import {type EditStateFor, getInitialEditState} from '../store/document/document-pair/editState'
import {getIdPair} from '../util/draftUtils'
import {useSchema} from './useSchema'

// Snapshot refs (draft/published/version) are preserved upstream when content
// hasn't changed, so ref equality on those + ready + transactionSyncLock catches
// real changes without a deep walk. Upstream contract: `document-pair/editState.test.ts`.
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
  const schema = useSchema()

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

  // Rendered until the pipeline emits. Derived per render rather than passed as react-rx's
  // `initialValue`, which is captured once per hook instance and would carry the previous
  // document's id through an identity swap.
  const initialState = useMemo(
    () => getInitialEditState(schema, getIdPair(publishedDocId, {version}), docTypeName),
    [docTypeName, publishedDocId, schema, version],
  )

  return useSyncObservable(observable, undefined) ?? initialState
}
