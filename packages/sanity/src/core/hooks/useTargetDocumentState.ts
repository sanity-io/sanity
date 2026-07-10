import {useMemo} from 'react'

import {type PerspectiveBundle} from '../perspective/types'
import {usePerspective} from '../perspective/usePerspective'
import {useDocumentVersions} from '../releases/hooks/useDocumentVersions'
import {type VersionInfoDocumentStub} from '../releases/store/types'
import {getTargetDocument} from '../util/getTargetDocument'
import {useAllVariants} from '../variants/store/useAllVariants'
import {type SystemVariant} from '../variants/types'

/**
 * The resolution state of the document targeted by the selected perspective (bundle) and variant.
 *
 * The union is shaped by what consumers must do, not just by what was observed:
 *
 * - `resolving` — a lookup (variant definitions or version stubs) is still in flight. Consumers
 *   must not fall back to the base draft/published pair; treat the target as not ready.
 * - `ready` — resolution finished. `targetDocument` is the version stub matching the current
 *   bundle (and variant, when one is selected); it is `undefined` only when no variant is
 *   selected and no stub exists for the bundle, in which case base draft/published semantics
 *   legitimately apply. `scopeId` is the bundle segment to thread into version-aware hooks
 *   (release id for release stubs, opaque scope hash for variant stubs, `undefined` for the
 *   base pair).
 * - `variant-missing` — a variant is selected but the document has no variant-scoped version
 *   for the current bundle. Consumers must treat the document as read-only and offer creation;
 *   never fall back to the base pair.
 * - `variant-definition-document-not-found` — the requested variant name matches no
 *   `system.variant` definition. An error state, never silently treated as "no variant".
 *
 * @internal
 * @beta
 */
export type TargetDocumentState =
  | {status: 'resolving'}
  | {
      status: 'ready'
      targetDocument: VersionInfoDocumentStub | undefined
      scopeId: string | undefined
      /** The selected variant when the resolved target is a variant-scoped version. */
      variant: SystemVariant | undefined
    }
  | {status: 'variant-missing'; variant: SystemVariant; bundle: PerspectiveBundle}
  | {status: 'variant-definition-document-not-found'; requestedVariantName: string}

const RESOLVING: TargetDocumentState = {status: 'resolving'}

/**
 * Returns the scope id to thread into version-aware hooks (`useEditState`,
 * `useDocumentOperation`, etc.) for a resolved target, or `undefined` when the target is not
 * ready or the base draft/published pair applies.
 *
 * @internal
 * @beta
 */
export function getTargetScopeId(state: TargetDocumentState): string | undefined {
  return state.status === 'ready' ? state.scopeId : undefined
}

/**
 * Pure resolution logic for {@link useTargetDocumentState}, extracted for testability.
 *
 * @internal
 */
export function getTargetDocumentState(options: {
  bundle: PerspectiveBundle
  selectedVariant: SystemVariant | undefined
  selectedVariantName: string | undefined
  variantsLoading: boolean
  versions: VersionInfoDocumentStub[]
  versionsLoading: boolean
}): TargetDocumentState {
  const {bundle, selectedVariant, selectedVariantName, variantsLoading, versions, versionsLoading} =
    options

  if (!selectedVariantName) {
    if (versionsLoading) {
      return RESOLVING
    }
    const targetDocument = getTargetDocument({
      bundle,
      variant: undefined,
      documentVersions: versions,
    })
    return {
      status: 'ready',
      targetDocument,
      scopeId: targetDocument?._system.scopeId ?? undefined,
      variant: undefined,
    }
  }

  if (variantsLoading) {
    return RESOLVING
  }

  if (!selectedVariant) {
    return {
      status: 'variant-definition-document-not-found',
      requestedVariantName: selectedVariantName,
    }
  }

  if (versionsLoading) {
    return RESOLVING
  }

  const targetDocument = getTargetDocument({
    bundle,
    variant: selectedVariant._id,
    documentVersions: versions,
  })

  if (!targetDocument) {
    return {status: 'variant-missing', variant: selectedVariant, bundle}
  }

  return {
    status: 'ready',
    targetDocument,
    scopeId: targetDocument._system.scopeId ?? undefined,
    variant: selectedVariant,
  }
}

/**
 * Resolves the document targeted by the selected perspective and variant for a document group,
 * as an explicit {@link TargetDocumentState}.
 *
 * Unlike a plain "target document or undefined" lookup, the returned state distinguishes the
 * in-flight lookups (`resolving`), the definitive absence of a variant-scoped version
 * (`variant-missing`), and an invalid variant selection
 * (`variant-definition-document-not-found`) from the legitimate base draft/published fallback
 * (`ready` without a target document). Consumers must switch on `status` instead of treating
 * `undefined` as "no variant".
 *
 * @internal
 * @beta
 */
export function useTargetDocumentState(documentGroupId: string): TargetDocumentState {
  const {versions, loading: versionsLoading} = useDocumentVersions({documentId: documentGroupId})
  const {bundle, selectedVariant, selectedVariantName} = usePerspective()
  const {loading: variantsLoading} = useAllVariants()

  return useMemo(
    () =>
      getTargetDocumentState({
        bundle,
        selectedVariant,
        selectedVariantName,
        variantsLoading,
        versions,
        versionsLoading,
      }),
    [bundle, selectedVariant, selectedVariantName, variantsLoading, versions, versionsLoading],
  )
}
