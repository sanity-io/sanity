import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {type OperationsAPI, useDocumentStore} from '../store'
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
   * We know that since the observable has a startWith operator, it will always emit a value
   * and that's why the non-null assertion is used here
   */
  const api = useObservable(observable)!

  return useDocumentOperationWithComlinkHistory({
    api,
    docTypeName,
    publishedDocId,
  })
}
