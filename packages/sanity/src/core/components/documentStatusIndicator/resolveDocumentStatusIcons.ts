import {type PerspectiveBundle} from '../../perspective/types'
import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {isSystemBundle} from '../../util/draftUtils'
import {getTargetDocument, getVariantPublishedSibling} from '../../util/getTargetDocument'

type DocumentStatusIconKind = 'variant' | 'release' | 'draft' | 'published'

type DocumentStatusIconsOutcome =
  | 'variantPublishedWithDraft'
  | 'variantPublished'
  | 'variantDraftOnly'
  | 'defaultPublishedWithDraft'
  | 'defaultPublished'
  | 'defaultUnpublished'
  | 'inReleaseWithVariant'
  | 'inRelease'
  | 'notInRelease'

const DOCUMENT_STATUS_ICONS_BY_OUTCOME: Record<
  DocumentStatusIconsOutcome,
  DocumentStatusIconKind[]
> = {
  variantPublishedWithDraft: ['variant', 'draft', 'published'],
  variantPublished: ['variant', 'published'],
  variantDraftOnly: ['variant', 'draft'],
  defaultPublishedWithDraft: ['draft', 'published'],
  defaultPublished: ['published'],
  defaultUnpublished: [],
  inReleaseWithVariant: ['variant', 'release'],
  inRelease: ['release'],
  notInRelease: [],
}

interface DocumentStatusIconsContext {
  bundle: PerspectiveBundle
  variantId: string | undefined
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
    return resolveSystemDefaultOutcome(context)
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

  const draft =
    published &&
    Boolean(getTargetDocument({bundle: 'drafts', variant: undefined, documentVersions}))

  if (published && draft) {
    return 'defaultPublishedWithDraft'
  }

  if (published) {
    return 'defaultPublished'
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

  return resolveMembershipDefaultOutcome(context)
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
