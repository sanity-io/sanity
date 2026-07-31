import {type SanityDocumentLike} from '@sanity/types'
import {type RefObject, useLayoutEffect, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {map, of} from 'rxjs'

import {
  type CreatableTargetDocument,
  getCreatableVariantTarget,
  type TargetDocumentState,
} from '../../hooks/useTargetDocumentState'
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
  target: CreatableTargetDocument
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
 * The last snapshot of a draft variant observed while it existed, captured by the pane so the
 * creatable state can bridge the publish gap: publishing deletes the draft, and until the
 * published sibling document arrives over the network the form would otherwise flash empty over
 * the very content the user just published.
 *
 * `publishedSiblingRev` is the sibling stub's `_rev` at capture time. Publishing bumps it (the
 * sibling receives the draft's content), discarding does not — comparing it against the current
 * stub is what keeps just-discarded content from flashing back into the form.
 *
 * @internal
 * @beta
 */
export interface LastKnownVariantDraft {
  /** The last version snapshot observed while the draft variant existed. */
  value: SanityDocumentLike
  /** `_rev` of the published sibling stub at capture time (`undefined` before first publish). */
  publishedSiblingRev: string | undefined
}

/**
 * Resolves the {@link InitialValueState} for the document form: for a creatable missing draft
 * variant (see `getCreatableVariantTarget`), the published sibling is observed live and served as
 * the initial value via {@link buildCreatableVariantInitialValue}; every other state passes
 * `fallback` (the template-resolved initial value) through untouched.
 *
 * Loading is honest: the state stays `loading` until the sibling document arrives, so the form
 * never flashes an empty document where the published variant content belongs. One exception —
 * when `lastKnownDraftRef` holds the snapshot of the draft that was just published (same id as
 * the creatable target, sibling `_rev` changed since capture), that snapshot is served
 * immediately: after a publish it is exactly the published content, so the form stays populated
 * across the round-trip. If the sibling is concurrently unpublished, the target state flips away
 * from creatable and `fallback` applies again.
 *
 * @internal
 * @beta
 */
export function useCreatableVariantInitialValue(
  targetDocumentState: TargetDocumentState,
  fallback: InitialValueState,
  lastKnownDraftRef?: RefObject<LastKnownVariantDraft | null>,
): InitialValueState {
  const documentPreviewStore = useDocumentPreviewStore()
  const creatableTarget = getCreatableVariantTarget(targetDocumentState)
  const isVariantMissing = targetDocumentState.status === 'variant-missing'
  const variantId = isVariantMissing ? targetDocumentState.variant._id : undefined
  const publishedSiblingId = isVariantMissing
    ? targetDocumentState.publishedSibling?._id
    : undefined
  const publishedSiblingRev = isVariantMissing
    ? targetDocumentState.publishedSibling?._rev
    : undefined
  const targetId = creatableTarget?.id
  const targetScopeId = creatableTarget?.scopeId

  const publishedSibling$ = useMemo(() => {
    if (!targetId || !publishedSiblingId) {
      return of(null)
    }
    return documentPreviewStore
      .unstable_observeDocument(publishedSiblingId)
      .pipe(map((doc) => doc ?? null))
  }, [targetId, publishedSiblingId, documentPreviewStore])
  const publishedSibling = useObservable(publishedSibling$, null)

  // Refs must not be read during render, so on entering the creatable state the captured
  // snapshot is promoted to state here. A layout effect keeps the promotion synchronous
  // (before paint), so the bridged content never flashes a loading frame first. The ref can't
  // change while the state stays creatable (capture only happens while the draft exists), so
  // one promotion per entry is enough.
  const [bridgeDraft, setBridgeDraft] = useState<LastKnownVariantDraft | null>(null)
  useLayoutEffect(() => {
    setBridgeDraft(targetId ? (lastKnownDraftRef?.current ?? null) : null)
  }, [targetId, lastKnownDraftRef])

  return useMemo(() => {
    if (!targetId || !targetScopeId || !variantId) {
      return fallback
    }
    if (!publishedSibling) {
      // Publish just deleted the draft this pane was displaying: bridge the network gap with
      // its last snapshot instead of flashing an empty loading form. The `_rev` comparison
      // limits the bridge to publishes — a discard leaves the sibling untouched, and serving
      // the snapshot there would flash the just-discarded content back into the form.
      if (
        bridgeDraft &&
        bridgeDraft.value._id === targetId &&
        bridgeDraft.publishedSiblingRev !== publishedSiblingRev
      ) {
        const {_rev, ...content} = bridgeDraft.value
        return {loading: false, error: null, value: content}
      }
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
  }, [
    targetId,
    targetScopeId,
    variantId,
    publishedSibling,
    publishedSiblingRev,
    bridgeDraft,
    fallback,
  ])
}
