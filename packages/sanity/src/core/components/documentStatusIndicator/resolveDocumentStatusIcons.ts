import {type PerspectiveBundle} from '../../perspective/types'
import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {isSystemBundle} from '../../util/draftUtils'
import {getTargetDocument, getVariantPublishedSibling} from '../../util/getTargetDocument'
import {type VariantId} from '../../variants/types'

/**
 * `variant` is the filled diamond: the marks before it describe the selected variant's version.
 * `variant-empty` is the outline diamond: the document has no version for the selected variant,
 * and the marks before it describe Default. Neither appears while no variant is selected.
 */
export type DocumentStatusIconKind = 'variant' | 'variant-empty' | 'release' | 'draft' | 'published'

type DocumentStatusIconsOutcome =
  | 'variantPublishedWithDraft'
  | 'variantPublished'
  | 'variantDraftOnly'
  | 'defaultPublishedWithDraft'
  | 'defaultPublished'
  | 'defaultDraftOnly'
  | 'defaultUnpublished'
  | 'noVariantPublishedWithDraft'
  | 'noVariantPublished'
  | 'noVariantDraftOnly'
  | 'noVariantUnpublished'
  | 'inReleaseWithVariant'
  | 'inRelease'
  | 'notInRelease'
  | 'inReleaseNoVariant'
  | 'notInReleaseNoVariant'

const DOCUMENT_STATUS_ICONS_BY_OUTCOME: Record<
  DocumentStatusIconsOutcome,
  DocumentStatusIconKind[]
> = {
  variantPublishedWithDraft: ['draft', 'published', 'variant'],
  variantPublished: ['published', 'variant'],
  variantDraftOnly: ['draft', 'variant'],
  defaultPublishedWithDraft: ['draft', 'published'],
  defaultPublished: ['published'],
  defaultDraftOnly: ['draft'],
  defaultUnpublished: [],
  noVariantPublishedWithDraft: ['draft', 'published', 'variant-empty'],
  noVariantPublished: ['published', 'variant-empty'],
  noVariantDraftOnly: ['draft', 'variant-empty'],
  noVariantUnpublished: ['variant-empty'],
  inReleaseWithVariant: ['release', 'variant'],
  inRelease: ['release'],
  notInRelease: [],
  inReleaseNoVariant: ['release', 'variant-empty'],
  notInReleaseNoVariant: ['variant-empty'],
}

/**
 * With a variant selected and no version for it, the marks describe Default and the row ends with
 * the outline diamond.
 */
const NO_VARIANT_OUTCOME_BY_DEFAULT_OUTCOME: Partial<
  Record<DocumentStatusIconsOutcome, DocumentStatusIconsOutcome>
> = {
  defaultPublishedWithDraft: 'noVariantPublishedWithDraft',
  defaultPublished: 'noVariantPublished',
  defaultDraftOnly: 'noVariantDraftOnly',
  defaultUnpublished: 'noVariantUnpublished',
  inRelease: 'inReleaseNoVariant',
  notInRelease: 'notInReleaseNoVariant',
}

function withoutVariantVersion(outcome: DocumentStatusIconsOutcome): DocumentStatusIconsOutcome {
  return NO_VARIANT_OUTCOME_BY_DEFAULT_OUTCOME[outcome] ?? outcome
}

interface DocumentStatusIconsContext {
  bundle: PerspectiveBundle
  variantId: VariantId | undefined
  documentVersions: VersionInfoDocumentStub[]
}

function resolveSystemVariantOutcome(
  context: DocumentStatusIconsContext,
): DocumentStatusIconsOutcome {
  const {variantId, documentVersions} = context

  if (!variantId) {
    return resolveSystemDefaultOutcome(context)
  }

  const draft = getTargetDocument({bundle: 'drafts', variant: variantId, documentVersions})
  const published = getVariantPublishedSibling({variant: variantId, documentVersions})

  if (!draft && !published) {
    return withoutVariantVersion(resolveSystemDefaultOutcome(context))
  }

  if (published && draft) {
    return 'variantPublishedWithDraft'
  }

  if (published) {
    return 'variantPublished'
  }

  return 'variantDraftOnly'
}

function resolveSystemDefaultOutcome(
  context: DocumentStatusIconsContext,
): DocumentStatusIconsOutcome {
  const {documentVersions} = context

  const published = Boolean(
    getTargetDocument({bundle: 'published', variant: undefined, documentVersions}),
  )

  const draft = Boolean(getTargetDocument({bundle: 'drafts', variant: undefined, documentVersions}))

  if (published && draft) {
    return 'defaultPublishedWithDraft'
  }

  if (published) {
    return 'defaultPublished'
  }

  if (draft) {
    return 'defaultDraftOnly'
  }

  return 'defaultUnpublished'
}

function resolveMembershipVariantOutcome(
  context: DocumentStatusIconsContext,
): DocumentStatusIconsOutcome {
  const {bundle, variantId, documentVersions} = context

  if (!variantId) {
    return resolveMembershipDefaultOutcome(context)
  }

  const inVariant = getTargetDocument({bundle, variant: variantId, documentVersions})

  if (inVariant) {
    return 'inReleaseWithVariant'
  }

  return withoutVariantVersion(resolveMembershipDefaultOutcome(context))
}

function resolveMembershipDefaultOutcome(
  context: DocumentStatusIconsContext,
): DocumentStatusIconsOutcome {
  const {bundle, documentVersions} = context

  const inDefault = getTargetDocument({bundle, variant: undefined, documentVersions})

  return inDefault ? 'inRelease' : 'notInRelease'
}

/**
 * Resolves the named outcome for the selected perspective and variant.
 *
 * @internal
 */
export function resolveDocumentStatusIconsOutcome(
  context: DocumentStatusIconsContext,
): DocumentStatusIconsOutcome {
  return isSystemBundle(context.bundle)
    ? resolveSystemVariantOutcome(context)
    : resolveMembershipVariantOutcome(context)
}

/**
 * Resolves which document status icons to show for the selected perspective and variant.
 *
 * @internal
 */
export function resolveDocumentStatusIcons(
  context: DocumentStatusIconsContext,
): DocumentStatusIconKind[] {
  return DOCUMENT_STATUS_ICONS_BY_OUTCOME[resolveDocumentStatusIconsOutcome(context)]
}
