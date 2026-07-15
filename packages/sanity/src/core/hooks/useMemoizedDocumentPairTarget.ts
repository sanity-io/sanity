import {useMemo} from 'react'

import {normalizeDocumentPairTarget} from '../store/document/normalizeDocumentPairTarget'
import {type DocumentPairTarget} from '../store/document/types'

/**
 * Returns a referentially stable {@link DocumentPairTarget} for the document pair APIs.
 *
 * Callers commonly build the target inline on every render (e.g. via `getPairTarget(...)`), so
 * keying a memo on the target object directly would recreate it every time — and resubscribing
 * `pair.editOperations` re-checks out the pair. This hook destructures the target into its
 * primitives and memoizes the object on them, so the returned reference only changes when the
 * target's contents change.
 *
 * A bare string is back-compat shorthand for a plain version target (its scope id, i.e. the
 * `<scopeId>` segment of `versions.<scopeId>.<groupId>`); `undefined` means the base
 * draft/published pair.
 *
 * @internal
 */
export function useMemoizedDocumentPairTarget(
  version: string | DocumentPairTarget | undefined,
): DocumentPairTarget | undefined {
  const target = normalizeDocumentPairTarget(version)
  const kind = target?.kind
  const scopeId =
    target?.kind === 'version' || target?.kind === 'variant' ? target.scopeId : undefined
  const variantId =
    target?.kind === 'variant' || target?.kind === 'target-missing' ? target.variantId : undefined

  return useMemo((): DocumentPairTarget | undefined => {
    switch (kind) {
      case 'version':
        return {kind: 'version', scopeId: scopeId!}
      case 'variant':
        return {kind: 'variant', scopeId: scopeId!, variantId: variantId!}
      case 'target-missing':
        // Preserve the input shape exactly: no `variantId: undefined` key when none was given.
        return variantId === undefined
          ? {kind: 'target-missing'}
          : {kind: 'target-missing', variantId}
      case 'unresolved':
        return {kind: 'unresolved'}
      default:
        return undefined
    }
  }, [kind, scopeId, variantId])
}
