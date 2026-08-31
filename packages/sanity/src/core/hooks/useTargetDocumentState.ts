import {useMemo} from 'react'

import {type PerspectiveBundle} from '../perspective/types'
import {usePerspective} from '../perspective/usePerspective'
import {useDocumentVersions} from '../releases/hooks/useDocumentVersions'
import {type VersionInfoDocumentStub} from '../releases/store/types'
import {type DocumentPairTarget} from '../store/document/types'
import {getVersionFromId, isSystemBundle} from '../util/draftUtils'
import {getTargetDocument} from '../util/getTargetDocument'
import {useAllVariants} from '../variants/store/useAllVariants'
import {type SystemVariant} from '../variants/types'
import {useSchema} from './useSchema'

/**
 * The id and scope of a missing draft variant that can be created by typing: the id is known
 * ahead of creation because the variant-of-published sibling advertises it (`_system.draft`).
 *
 * @internal
 * @beta
 */
export interface CreatableTargetDocument {
  /** The full version id (`versions.<scopeId>.<groupId>`) the draft variant will occupy. */
  id: string
  /** The bundle segment of {@link CreatableTargetDocument.id}, for pair checkout. */
  scopeId: string
}

/**
 * The published, draft, and release-scoped documents in the current lane (base pair when no
 * variant is selected, variant siblings when one is). Each field is `undefined` when that
 * document does not exist. Present on every resolved {@link TargetDocumentState}.
 *
 * @internal
 * @beta
 */
export interface TargetDocumentSiblings {
  published: VersionInfoDocumentStub | undefined
  draft: VersionInfoDocumentStub | undefined
  version: VersionInfoDocumentStub | undefined
}

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
 *   base pair). `siblings` always lists the published, draft, and non system bundle scoped documents in
 *   the current lane (base pair or variant), each `undefined` when that document does not exist.
 * - `variant-missing` — a variant is selected but the document has no variant-scoped version
 *   for the current bundle. When `creatableTarget` is set (drafts bundle, non-live-edit,
 *   published variant advertising its draft sibling id), the document is editable: typing
 *   creates the draft variant at the advertised id, seeded from the published sibling.
 *   Live-edit documents pinned to drafts never take this path: they resolve as the published
 *   sibling (`ready`) instead of a creatable draft.
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
      siblings: TargetDocumentSiblings
    }
  | {
      status: 'variant-missing'
      variant: SystemVariant
      bundle: PerspectiveBundle
      siblings: TargetDocumentSiblings
      /**
       * Present when the missing variant document can be created by typing: the drafts-bundle
       * variant of a published variant whose `_system.draft` weak ref advertises the (stable,
       * server-generated) id the draft will occupy. The pair is checked out at this id with
       * `allowCreate` declared to the store, and the display falls back to `siblings.published`
       * until the document exists.
       */
      creatableTarget?: CreatableTargetDocument
    }
  | {status: 'variant-definition-document-not-found'; requestedVariantName: string}

const RESOLVING: TargetDocumentState = {status: 'resolving'}

/**
 * Resolves the creatable draft variant for a missing target: only the drafts bundle qualifies
 * (release-scoped variants have no advertised draft refs yet, and the published bundle's missing
 * target *is* the sibling), and only when the variant-of-published sibling advertises
 * `_system.draft`. The id is server-advertised, never computed — this is what keeps the "never
 * guess a variant scope id client-side" invariant intact.
 */
function getCreatableTarget(
  bundle: PerspectiveBundle,
  publishedSibling: VersionInfoDocumentStub | undefined,
): CreatableTargetDocument | undefined {
  if (bundle !== 'drafts' || !publishedSibling) {
    return undefined
  }
  const draftId = publishedSibling._system.draft?._ref
  if (!draftId) {
    return undefined
  }
  const scopeId = getVersionFromId(draftId)
  if (!scopeId) {
    return undefined
  }
  return {id: draftId, scopeId}
}

function getDocumentSiblings(
  versions: VersionInfoDocumentStub[],
  variantId: string | undefined,
  bundle: PerspectiveBundle,
): TargetDocumentSiblings {
  return {
    published: getTargetDocument({
      bundle: 'published',
      variant: variantId,
      documentVersions: versions,
    }),
    draft: getTargetDocument({
      bundle: 'drafts',
      variant: variantId,
      documentVersions: versions,
    }),
    version: isSystemBundle(bundle)
      ? undefined
      : getTargetDocument({
          bundle,
          variant: variantId,
          documentVersions: versions,
        }),
  }
}

/**
 * Returns the scope id to thread into version-aware hooks (`useEditState`,
 * `useDocumentOperation`, etc.) for a resolved target, or `undefined` when the target is not
 * ready or the base draft/published pair applies.
 *
 * A `variant-missing` state with a {@link CreatableTargetDocument} yields the creatable draft's
 * scope id: the pair is checked out at the advertised id from the beginning, so typing (and every
 * version-aware read: edit state, sync state, connection) addresses the document being created —
 * never the base pair, and never the published sibling.
 *
 * @internal
 * @beta
 */
export function getTargetScopeId(state: TargetDocumentState): string | undefined {
  if (state.status === 'ready') {
    return state.scopeId
  }
  if (state.status === 'variant-missing') {
    return state.creatableTarget?.scopeId
  }
  return undefined
}

/**
 * The creatable draft variant of a `variant-missing` state, or `undefined` for every other
 * state. Present when the missing target can be created by typing at a server-advertised id
 * (see {@link CreatableTargetDocument}); consumers use it to exempt the state from the
 * read-only/banner/footer gating that otherwise applies to unresolved variant targets.
 *
 * @internal
 * @beta
 */
export function getCreatableVariantTarget(
  state: TargetDocumentState,
): CreatableTargetDocument | undefined {
  return state.status === 'variant-missing' ? state.creatableTarget : undefined
}

/**
 * The published/draft/release siblings of a resolved target, or `undefined` while the target is
 * still resolving or the selected variant definition was not found.
 *
 * @internal
 * @beta
 */
export function getTargetSiblings(state: TargetDocumentState): TargetDocumentSiblings | undefined {
  if (state.status === 'ready' || state.status === 'variant-missing') {
    return state.siblings
  }
  return undefined
}

/**
 * Maps a {@link TargetDocumentState} to the `target` parameter of `useDocumentOperation` /
 * `pair.editOperations`, preserving the guarded states: `resolving` yields `unresolved`
 * (operations stay `NOT_READY`), and `variant-missing` / `variant-definition-document-not-found`
 * yield `target-missing` (operations disabled with `TARGET_NOT_FOUND`). Both throw if executed,
 * so operations can never silently fall back to the base draft/published pair.
 *
 * A `variant-missing` state with a {@link CreatableTargetDocument} yields a `variant` target with
 * `allowCreate`: the store keeps `patch`/`commit` enabled so typing creates the draft variant at
 * the advertised id, while publish/unpublish/discard stay disabled until the document exists.
 *
 * @internal
 * @beta
 */
export function getPairTarget(state: TargetDocumentState): DocumentPairTarget | string | undefined {
  switch (state.status) {
    case 'resolving':
      return {kind: 'unresolved'}
    case 'variant-missing':
      if (state.creatableTarget) {
        return {
          kind: 'variant',
          scopeId: state.creatableTarget.scopeId,
          variantId: state.variant._id,
          allowCreate: true,
        }
      }
      return {kind: 'target-missing', variantId: state.variant._id}
    case 'variant-definition-document-not-found':
      return {kind: 'target-missing'}
    case 'ready':
      if (state.variant) {
        // A resolved variant target always carries its scope id; treat a malformed stub without
        // one as missing rather than falling back to the base pair.
        return state.scopeId
          ? {kind: 'variant', scopeId: state.scopeId, variantId: state.variant._id}
          : {kind: 'target-missing', variantId: state.variant._id}
      }
      return state.scopeId
    default:
      return undefined
  }
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
  /**
   * Derived by {@link useTargetDocumentState} from the schema. When set, a drafts-bundle
   * lookup remaps to published: live-edit types have no drafts lane, so the
   * variant-of-published is the edit target (never a type-to-create draft).
   */
  liveEdit?: boolean
}): TargetDocumentState {
  const {
    bundle,
    selectedVariant,
    selectedVariantName,
    variantsLoading,
    versions,
    versionsLoading,
    liveEdit,
  } = options

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
      siblings: getDocumentSiblings(versions, undefined, bundle),
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

  const siblings = getDocumentSiblings(versions, selectedVariant._id, bundle)
  // Live-edit documents are edited in place on the published sibling. The studio is often
  // pinned to drafts, but live-edit types have no drafts lane — looking that up would miss
  // the published variant and offer a creatable draft (patches then create `bundleId: 'drafts'`).
  const targetBundle =
    liveEdit && bundle === 'drafts' && !siblings.draft?._id ? 'published' : bundle

  const targetDocument = getTargetDocument({
    bundle: targetBundle,
    variant: selectedVariant._id,
    documentVersions: versions,
  })

  if (!targetDocument) {
    return {
      status: 'variant-missing',
      variant: selectedVariant,
      bundle,
      siblings,
      creatableTarget:
        liveEdit && bundle === 'drafts'
          ? undefined
          : getCreatableTarget(bundle, siblings.published),
    }
  }

  return {
    status: 'ready',
    targetDocument,
    scopeId: targetDocument._system.scopeId ?? undefined,
    variant: selectedVariant,
    siblings,
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
 * Live-edit is read from the schema via version stubs (`_type`)
 *
 * @internal
 * @beta
 */
export function useTargetDocumentState(documentGroupId: string): TargetDocumentState {
  const {versions, loading: versionsLoading} = useDocumentVersions({documentId: documentGroupId})
  const {bundle, selectedVariant, selectedVariantName} = usePerspective()
  const {loading: variantsLoading} = useAllVariants()
  const schema = useSchema()
  const liveEdit = versions.some((version) => schema.get(version._type)?.liveEdit === true)

  return useMemo(
    () =>
      getTargetDocumentState({
        bundle,
        selectedVariant,
        selectedVariantName,
        variantsLoading,
        versions,
        versionsLoading,
        liveEdit,
      }),
    [
      bundle,
      selectedVariant,
      selectedVariantName,
      variantsLoading,
      versions,
      versionsLoading,
      liveEdit,
    ],
  )
}
