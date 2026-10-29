import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {getVariantPublishedSibling} from '../../util/getTargetDocument'
import {type VariantId} from '../../variants/types'

export interface ManageVersionsCreateBase {
  _id: string
}

/**
 * Base document for the manage-versions "create variant" action.
 *
 * A published variant of the selected variant wins. Otherwise the caller’s
 * fallback is used (draft base, then published base, or the release version).
 *
 * @internal
 */
export function resolveManageVersionsCreateBase({
  variantId,
  documentVersions,
  fallback,
}: {
  variantId: VariantId
  documentVersions: VersionInfoDocumentStub[]
  fallback: ManageVersionsCreateBase | null
}): ManageVersionsCreateBase | null {
  const publishedVariant = getVariantPublishedSibling({
    variant: variantId,
    documentVersions,
  })

  if (publishedVariant) {
    return {_id: publishedVariant._id}
  }

  return fallback ? {_id: fallback._id} : null
}
