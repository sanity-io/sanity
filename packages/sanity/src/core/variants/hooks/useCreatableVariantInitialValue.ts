import {type SanityDocumentLike} from '@sanity/types'
import {useMemo} from 'react'
import {useSyncObservable} from 'react-rx'
import {map, of} from 'rxjs'

import {getTargetSiblings, type TargetDocumentState} from '../../hooks/useTargetDocumentState'
import {useDocumentPreviewStore} from '../../store/datastores'
import {type InitialValueState} from '../../store/document/initialValue/types'
import {getPublishedId} from '../../util/draftUtils'

/**
 * Builds the initial value for a creatable missing draft variant from its published sibling: the
 * sibling's content re-identified as the draft target, with `_system` rewritten for the draft
 * (`{variant, bundleId: 'drafts', scopeId, group}`) and the sibling's `_rev` dropped (the
 * draft-to-be has no revision).
 *
 * The value serves double duty through the form's `initialValue`: it is displayed until the
 * document exists, and it seeds the create issued by the first keystroke
 * (`version.create({...initialDocument})` in the store's patch operation, which strips
 * `_id`/`_rev`/`_updatedAt`). Writing `_system` client-side keeps operation routing
 * (`getVariantVersionInfo`), the anti-corruption tripwires, and the `version.create` action
 * mapping honest during the optimistic window before the server-stamped snapshot arrives.
 *
 * @internal
 * @beta
 */
export function buildCreatableVariantInitialValue(options: {
  publishedSibling: SanityDocumentLike
  target: {scopeId: string; id: string}
  variantId: string
}): SanityDocumentLike {
  const {publishedSibling, target, variantId} = options
  const {_rev, ...content} = publishedSibling
  return {
    ...content,
    _id: target.id,
    _system: {
      group: publishedSibling._system?.group ?? {
        _ref: getPublishedId(target.id),
        _weak: true as const,
      },
      variant: {_ref: variantId, _weak: true as const},
      bundleId: 'drafts',
      scopeId: target.scopeId,
    },
  }
}

/**
 * Resolves the {@link InitialValueState} for the document form: for a creatable missing draft
 * variant (see `getCreatableVariantTarget`), the published sibling is observed live and served as
 * the initial value via {@link buildCreatableVariantInitialValue}; every other state passes
 * `fallback` (the template-resolved initial value) through untouched.
 *
 * Loading is honest: the state stays `loading` until the sibling document arrives, so the form
 * never flashes an empty document where the published variant content belongs. If the sibling is
 * concurrently unpublished, the target state flips away from creatable and `fallback` applies
 * again.
 *
 * @internal
 * @beta
 */
export function useCreatableVariantInitialValue(
  targetDocumentState: TargetDocumentState,
  fallback: InitialValueState,
): InitialValueState {
  const documentPreviewStore = useDocumentPreviewStore()
  const isVariantMissing = targetDocumentState.status === 'variant-missing'
  const variantId = isVariantMissing ? targetDocumentState.variant._id : undefined
  const siblings = getTargetSiblings(targetDocumentState)

  const publishedSiblingVersionStub = siblings?.published
  const publishedSiblingId = publishedSiblingVersionStub?._id
  const targetId = publishedSiblingVersionStub?._system.draft?._ref
  const targetScopeId = publishedSiblingVersionStub?._system.scopeId

  const publishedSibling$ = useMemo(() => {
    if (!targetId || !publishedSiblingId) {
      return of(null)
    }
    return documentPreviewStore
      .unstable_observeDocument(publishedSiblingId)
      .pipe(map((doc) => doc ?? null))
  }, [targetId, publishedSiblingId, documentPreviewStore])
  // Kept synchronous: the sibling snapshot feeds the initial value used when
  // creating the variant document, so a deferred read could seed the new
  // document from a stale sibling.
  const publishedSibling = useSyncObservable(publishedSibling$, null)

  return useMemo(() => {
    if (!targetId || !targetScopeId || !variantId) {
      return fallback
    }
    if (!publishedSibling) {
      return {loading: true, error: null, value: {_id: targetId, _type: fallback.value._type}}
    }
    return {
      loading: false,
      error: null,
      value: buildCreatableVariantInitialValue({
        publishedSibling,
        target: {id: targetId, scopeId: targetScopeId},
        variantId,
      }),
    }
  }, [targetId, targetScopeId, variantId, publishedSibling, fallback])
}
