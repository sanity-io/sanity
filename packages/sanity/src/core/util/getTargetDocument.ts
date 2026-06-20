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
