import {useMemo} from 'react'
import {useSyncObservable} from 'react-rx'

import {useDocumentStore} from '../store/datastores'
import {GUARDED} from '../store/document/document-pair/operations/helpers'
import {type OperationsAPI} from '../store/document/document-pair/operations/types'
import {type DocumentPairTarget} from '../store/document/types'
import {useDocumentOperationWithComlinkHistory} from './useDocumentOperationWithComlinkHistory'
import {useMemoizedDocumentPairTarget} from './useMemoizedDocumentPairTarget'

/**
 * @internal
 * `version` accepts either a plain version name (release/bundle) or a {@link DocumentPairTarget}
 * declaring the resolved target of the selected perspective/variant. With the guarded target
 * kinds (`unresolved`, `target-missing`) the returned operations are disabled and throw if
 * executed, instead of silently operating on the base draft/published pair.
 */
export function useDocumentOperation(
  publishedDocId: string,
  docTypeName: string,
  version?: string | DocumentPairTarget,
): OperationsAPI {
  const documentStore = useDocumentStore()

  // A referentially stable target: a caller passing a fresh target object on every render must
  // not recreate the observable (which would resubscribe the pair).
  const target = useMemoizedDocumentPairTarget(version)

  const observable = useMemo(
    () => documentStore.pair.editOperations(publishedDocId, docTypeName, target),
    [docTypeName, documentStore.pair, publishedDocId, target],
  )

  /**
   * `GUARDED` mirrors the observable's own first emission (`concat(of(GUARDED), …)`): every
   * operation is present but guarded until the real API arrives right after mount.
   *
   * Kept synchronous: the operations are imperative emitters bound to the
   * document id/type they were created for, so a deferred (stale) API could
   * execute an action against the previously viewed document after navigation.
   */
  const api = useSyncObservable(observable, GUARDED)

  return useDocumentOperationWithComlinkHistory({
    api,
    docTypeName,
    publishedDocId,
  })
}
