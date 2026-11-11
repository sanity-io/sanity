import {
  type DocumentStatusIconKind,
  resolveDocumentStatusIcons,
} from '../../components/documentStatusIndicator/resolveDocumentStatusIcons'
import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {getDocumentVersionVariantId} from '../../util/getDocumentVersionVariant'

/**
 * The status icons for one row of the inventory: the icons the document list would show with
 * the row's own bundle and variant selected, so a draft row reads draft or changed, a published
 * row reads published, and a release row shows its release.
 *
 * @internal
 */
export function resolveVersionStatusIcons({
  document,
  documentVersions,
}: {
  document: VersionInfoDocumentStub
  documentVersions: VersionInfoDocumentStub[]
}): DocumentStatusIconKind[] {
  const bundle = document._system.bundleId ?? 'published'

  return resolveDocumentStatusIcons({
    bundle,
    variantId: getDocumentVersionVariantId(document),
    // The draft has a row of its own, so the published row leaves it out; with it, the
    // published row would read as changed.
    documentVersions:
      bundle === 'published'
        ? documentVersions.filter((version) => version._system.bundleId !== 'drafts')
        : documentVersions,
  })
}
