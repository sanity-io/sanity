import {type PerspectiveBundle} from '../perspective/types'
import {type DocumentPerspectiveState} from '../releases/hooks/useDocumentVersions'
import {type VersionInfoDocumentStub} from '../releases/store/types'
import {type VariantId} from '../variants/types'
import {getDocumentVersionVariantId} from './getDocumentVersionVariant'

/**
 * Finds the document version whose _system metadata matches the selected bundle and variant.
 *
 * `bundle` must be the canonical bundle id (`published`, `drafts` or a release id), matching
 * `_system.bundleId` exactly. For example, `bundle: 'published'` and `variant: undefined` matches
 * a version with no `bundleId` and no variant reference (`variants` empty or `null`).
 *
 * @internal
 */
export function getTargetDocument({
  bundle,
  documentVersions,
  variant,
}: {
  variant: VariantId | undefined
  bundle: PerspectiveBundle
  documentVersions: DocumentPerspectiveState['versions']
}): VersionInfoDocumentStub | undefined {
  return documentVersions.find((version) => {
    const inBundle =
      bundle === 'published' ? !version._system.bundleId : version._system.bundleId === bundle
    const variantId = getDocumentVersionVariantId(version)
    const inVariant = variant ? variantId === variant : !variantId
    return inBundle && inVariant
  })
}

/**
 * Finds the variant-of-published sibling for a variant: the version stub carrying the same
 * `_system.variants[0]` reference but no `_system.bundleId` (i.e. the published variant document).
 *
 * This is the document that publish-state gating must read for variant targets — the base
 * `published` document says nothing about whether the *variant* is published. `undefined` means
 * the variant has never been published.
 *
 * @internal
 */
export function getVariantPublishedSibling({
  documentVersions,
  variant,
}: {
  variant: VariantId
  documentVersions: DocumentPerspectiveState['versions']
}): VersionInfoDocumentStub | undefined {
  return getTargetDocument({bundle: 'published', variant, documentVersions})
}

/**
 * The base version a variant is compared with: the base in the same slot, else
 * the nearest base below it, by the same fall-through as the document's content. In a release: that release, then Drafts, then Published.
 * In Drafts: Drafts, then Published. In Published: Published. Undefined when the document has no base version at all.
 *
 * @internal
 */
export function getBaseComparisonTarget({
  bundle,
  documentVersions,
}: {
  bundle: PerspectiveBundle
  documentVersions: DocumentPerspectiveState['versions']
}): VersionInfoDocumentStub | undefined {
  const order: PerspectiveBundle[] =
    bundle === 'published'
      ? ['published']
      : bundle === 'drafts'
        ? ['drafts', 'published']
        : [bundle, 'drafts', 'published']
  for (const slot of order) {
    const found = getTargetDocument({bundle: slot, variant: undefined, documentVersions})
    if (found) return found
  }
  return undefined
}
