import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {getDocumentVersionVariantId} from '../../util/getDocumentVersionVariant'

/**
 * Whether a draft row's own copy has never been published: no published version of the same
 * variant (or of the base document, for a base draft) exists in the group.
 */
/** @internal */
export function isNeverPublishedDraft(
  version: VersionInfoDocumentStub,
  documentVersions: VersionInfoDocumentStub[],
): boolean {
  if (version._system.bundleId !== 'drafts') return false

  const variantId = getDocumentVersionVariantId(version)

  return !documentVersions.some(
    (other) =>
      (other._system.bundleId ?? 'published') === 'published' &&
      getDocumentVersionVariantId(other) === variantId,
  )
}
