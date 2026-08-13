import {type PerspectiveBundle} from '../perspective/types'
import {type DocumentPerspectiveState} from '../releases/hooks/useDocumentVersions'
import {type VersionInfoDocumentStub} from '../releases/store/types'

/**
 * Finds the document version whose _system metadata matches the selected bundle and variant.
 *
 * `bundle` must be the canonical bundle id (`published`, `drafts` or a release id), matching
 * `_system.bundleId` exactly. For example, `bundle: 'published'` and `variant: undefined` matches
 * a version with no `bundleId` and `variant: null`.
 *
 * @internal
 */
export function getTargetDocument({
  bundle,
  documentVersions,
  variant,
}: {
  variant: string | undefined
  bundle: PerspectiveBundle
  documentVersions: DocumentPerspectiveState['versions']
}): VersionInfoDocumentStub | undefined {
  return documentVersions.find((version) => {
    const inBundle =
      bundle === 'published' ? !version._system.bundleId : version._system.bundleId === bundle
    const inVariant = variant ? version._system.variant?._ref === variant : !version._system.variant
    return inBundle && inVariant
  })
}

/**
 * Finds the variant-of-published sibling for a variant: the version stub carrying the same
 * `_system.variant` reference but no `_system.bundleId` (i.e. the published variant document).
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
  variant: string
  documentVersions: DocumentPerspectiveState['versions']
}): VersionInfoDocumentStub | undefined {
  return getTargetDocument({bundle: 'published', variant, documentVersions})
}
