import {type PerspectiveBundle} from '../perspective/types'
import {
  type DocumentPerspectiveState,
  type DocumentVersion,
} from '../releases/hooks/useDocumentVersions'

/**
 * Finds the document version whose system metadata matches the selected bundle and variant.
 *
 * For example, `bundle: 'published'` and `variant: undefined` matches `bundleId: '$published'`
 * with `variant: null`.
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
}): DocumentVersion | undefined {
  return documentVersions.find(
    (version) =>
      // Checks the document is in the same bundle.
      version.system.bundleId === bundle &&
      // Checks the document is in the same variant or no variant is selected.
      (variant ? version.system.variant?._ref === variant : version.system.variant === null),
  )
}
