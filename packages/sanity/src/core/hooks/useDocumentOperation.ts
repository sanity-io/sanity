import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {type OperationsAPI, useDocumentStore} from '../store'
import {type DocumentPairTarget} from '../store/document/types'
import {useDocumentOperationWithComlinkHistory} from './useDocumentOperationWithComlinkHistory'

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

  // Destructure the target into primitives so a caller passing a fresh target object on every
  // render doesn't recreate the observable (which would resubscribe the pair). A bare string is
  // back-compat shorthand for a plain version target.
  const target: DocumentPairTarget | undefined =
    typeof version === 'string' ? {kind: 'version', name: version} : version
  const targetKind = target?.kind
  const targetName = target?.kind === 'version' ? target.name : undefined
  const targetScopeId = target?.kind === 'variant' ? target.scopeId : undefined
  const targetVariantId =
    target?.kind === 'variant' || target?.kind === 'target-missing' ? target.variantId : undefined

  const observable = useMemo(() => {
    let stableTarget: DocumentPairTarget | undefined
    switch (targetKind) {
      case 'version':
        stableTarget = {kind: 'version', name: targetName!}
        break
      case 'variant':
        stableTarget = {kind: 'variant', scopeId: targetScopeId!, variantId: targetVariantId!}
        break
      case 'target-missing':
        stableTarget = {kind: 'target-missing', variantId: targetVariantId}
        break
      case 'unresolved':
        stableTarget = {kind: 'unresolved'}
        break
      default:
        stableTarget = undefined
    }
    return documentStore.pair.editOperations(publishedDocId, docTypeName, stableTarget)
  }, [
    docTypeName,
    documentStore.pair,
    publishedDocId,
    targetKind,
    targetName,
    targetScopeId,
    targetVariantId,
  ])

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
