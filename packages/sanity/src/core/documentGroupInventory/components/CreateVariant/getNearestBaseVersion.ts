import {type VersionInfoDocumentStub} from '../../../releases/store/types'
import {getReleaseIdFromReleaseDocumentId} from '../../../releases/util/getReleaseIdFromReleaseDocumentId'
import {getTargetDocument, getVariantPublishedSibling} from '../../../util/getTargetDocument'
import {type VariantId} from '../../../variants/types'
import {type VariantCreationBundle} from '../../machines/variantCreationMachine'

/**
 * The version a new variant starts from when no other is picked. With no variant (the form
 * before a variant is picked), it is the Default variant's version for the bundle. With no bundle
 * (Add to not picked yet), only the variant's own published version can be named: the Default's
 * version depends on the bundle, so there is no answer until one is picked.
 */
export function getNearestBaseVersion({
  variantId,
  bundle,
  versions,
}: {
  variantId: VariantId | undefined
  bundle: VariantCreationBundle | undefined
  versions: VersionInfoDocumentStub[]
}): VersionInfoDocumentStub | undefined {
  const publishedVariant =
    typeof variantId === 'undefined'
      ? undefined
      : getVariantPublishedSibling({variant: variantId, documentVersions: versions})

  if (publishedVariant) {
    return publishedVariant
  }

  if (typeof bundle === 'undefined') {
    return undefined
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
