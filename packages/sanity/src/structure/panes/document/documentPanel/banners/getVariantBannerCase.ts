import {type TargetDocumentState} from 'sanity'

/**
 * The perspective the document pane shows, as far as the variant banners care.
 * - `drafts`: the Drafts perspective.
 * - `published`: the Published perspective.
 * - `release`: an open release (ASAP, at a time and not yet scheduled, or undecided), or a bundle id.
 * - `locked-release`: a scheduled (or scheduling) release; nothing can be added to it.
 */
export type VariantBannerPerspective = 'drafts' | 'published' | 'release' | 'locked-release'

/** @internal */
export interface VariantBannerCaseInput {
  targetDocumentState: TargetDocumentState
  perspective: VariantBannerPerspective
  /**
   * Whether the document has a Drafts perspective to edit in: the workspace has drafts on and the
   * type is not live edit.
   */
  hasDrafts: boolean
}

/**
 * Which variant banner the document pane shows, or `none`.
 *
 * - `create`: no version of the selected variant here, and one can be created in place
 *   (Drafts, an open release, or Published when the document has no Drafts).
 * - `create-in-drafts`: Published, the variant has no version here and no draft. The banner
 *   creates the draft and switches to Drafts in one step.
 * - `switch-to-drafts`: Published, the variant has no version here but has a draft.
 * - `locked-release`: a scheduled release, which is locked. The banner opens the release.
 * - `definition-not-found`: the selected variant matches no variant definition (it was
 *   deleted, or the URL names one that never existed). The banner goes back to Default.
 *
 * A variant that is published but has no draft is editable in Drafts (typing creates the
 * draft), so it has no banner: that is `variant-missing` with a `creatableTarget`.
 *
 * @internal
 */
export type VariantBannerCase =
  | {kind: 'none'}
  | {kind: 'create'; perspective: 'drafts' | 'published' | 'release'}
  | {kind: 'create-in-drafts'}
  | {kind: 'switch-to-drafts'}
  | {kind: 'locked-release'}
  | {kind: 'definition-not-found'; requestedVariantName: string}

const NONE: VariantBannerCase = {kind: 'none'}

/**
 * Decides the variant banner from the target document state and the perspective. No React, so
 * every case can be tested from a table.
 *
 * @internal
 */
export function getVariantBannerCase(input: VariantBannerCaseInput): VariantBannerCase {
  const {targetDocumentState, perspective, hasDrafts} = input

  if (targetDocumentState.status === 'variant-definition-document-not-found') {
    return {
      kind: 'definition-not-found',
      requestedVariantName: targetDocumentState.requestedVariantName,
    }
  }

  // A version is here, the target is still resolving, or the missing draft is created by typing.
  if (targetDocumentState.status !== 'variant-missing' || targetDocumentState.creatableTarget) {
    return NONE
  }

  switch (perspective) {
    case 'drafts':
      return {kind: 'create', perspective: 'drafts'}
    case 'release':
      return {kind: 'create', perspective: 'release'}
    case 'locked-release':
      return {kind: 'locked-release'}
    case 'published':
      // Without Drafts (live edit, or drafts off) the published variant is the one that is edited.
      if (!hasDrafts) return {kind: 'create', perspective: 'published'}
      return targetDocumentState.siblings.draft
        ? {kind: 'switch-to-drafts'}
        : {kind: 'create-in-drafts'}
    default:
      return NONE
  }
}
