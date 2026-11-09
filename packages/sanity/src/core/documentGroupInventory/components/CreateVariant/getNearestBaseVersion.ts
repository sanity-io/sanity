import {type VersionInfoDocumentStub} from '../../../releases/store/types'
import {getReleaseIdFromReleaseDocumentId} from '../../../releases/util/getReleaseIdFromReleaseDocumentId'
import {getTargetDocument, getVariantPublishedSibling} from '../../../util/getTargetDocument'
import {type VariantId} from '../../../variants/types'
import {type VariantCreationBundle} from '../../machines/variantCreationMachine'

/**
 * The version a new variant starts from when no other is picked.
 */
export function getNearestBaseVersion({
  variantId,
  bundle,
  versions,
}: {
  variantId: VariantId
  bundle: VariantCreationBundle
  versions: VersionInfoDocumentStub[]
}): VersionInfoDocumentStub | undefined {
  const publishedVariant = getVariantPublishedSibling({
    variant: variantId,
    documentVersions: versions,
  })

  if (publishedVariant) {
    return publishedVariant
  }

  if (bundle.type === 'drafts') {
    return (
      getTargetDocument({bundle: 'drafts', variant: undefined, documentVersions: versions}) ??
      getTargetDocument({bundle: 'published', variant: undefined, documentVersions: versions})
    )
  }

  return getTargetDocument({
    bundle: getReleaseIdFromReleaseDocumentId(bundle.releaseId),
    variant: undefined,
    documentVersions: versions,
  })
}
