import {useMemo} from 'react'
import {useSyncObservable} from 'react-rx'
import {debounce, distinctUntilChanged, merge, share, shareReplay, skip, take, timer} from 'rxjs'

import {useDocumentStore} from '../store/datastores'
import {type EditStateFor} from '../store/document/document-pair/editState'
import {isLiveEditEnabled} from '../store/document/document-pair/utils/isLiveEditEnabled'
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

  // Mirrors the cold-start `startWith` emission of the `editState` store observable: it renders
  // on the first pass, before the commit-time subscription delivers the store's own emission
  // (react-rx v7 never subscribes during render). For a warm pair the replayed snapshot replaces
  // it right after mount, in the same paint cycle.
  const initialValue = useMemo((): EditStateFor => {
    const liveEditSchemaType = isLiveEditEnabled(schema, docTypeName)
    return {
      id: publishedDocId,
      type: docTypeName,
      draft: null,
      published: null,
      version: null,
      liveEdit: typeof version !== 'undefined' || liveEditSchemaType,
      liveEditSchemaType,
      ready: false,
      transactionSyncLock: null,
      release: version,
      scopeId: version,
    }
  }, [docTypeName, publishedDocId, schema, version])

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
  return useSyncObservable(observable, initialValue)
}
