import {type ReleaseDocument} from '@sanity/client'

import {isReleaseDocument, type VersionInfoDocumentStub} from '../../releases/store/types'
import {getReleaseIdFromReleaseDocumentId} from '../../releases/util/getReleaseIdFromReleaseDocumentId'
import {isReleaseScheduledOrScheduling} from '../../releases/util/util'
import {getTargetDocument} from '../../util/getTargetDocument'
import {isVariantId} from '../../variants/types'

/**
 * The document pane's inspector param that opens the document group inventory. Same value as the
 * structure tool's `DOCUMENT_GROUP_INSPECTOR_NAME`, which core cannot import.
 */
const DOCUMENT_GROUP_INSPECTOR = 'sanity/structure/document-group'

/**
 * The document pane param that asks for a variant to be created. Same value as the structure
 * tool's `CREATE_VARIANT_PARAM`, which core cannot import.
 */
const CREATE_VARIANT_PARAM = 'createVariant'

/**
 * The `edit` intent params that open a document with the document group inventory beside it, as a
 * pick in the versions flyout does from search results and reference previews. The edit intent
 * passes every param but `id`, `type` and `template` on to the document pane.
 *
 * With a picked variant that has no version in the release in view (a release that can still take
 * versions), `createVariant=<variant id>` is added too, so Manage versions opens with its Create
 * variant form ready, as the document list's flyout does (`getCreateVariantPaneParams`).
 *
 * @internal
 */
export function getDocumentGroupIntentParams(options: {
  id: string
  type: string
  /** The picked audience, `null` for the Default one; leave it out for the inventory row. */
  variantId?: string | null
  /** The perspective in view, as `usePerspective` returns it. */
  selectedPerspective?: unknown
  /** The document group's versions. */
  versions?: VersionInfoDocumentStub[]
}): Record<string, string> {
  const {id, type, variantId, selectedPerspective, versions = []} = options
  const params: Record<string, string> = {id, type, inspect: DOCUMENT_GROUP_INSPECTOR}
  if (!isVariantId(variantId) || !isReleaseDocument(selectedPerspective)) return params
  const release: ReleaseDocument = selectedPerspective
  if (isReleaseScheduledOrScheduling(release)) return params
  const existing = getTargetDocument({
    bundle: getReleaseIdFromReleaseDocumentId(release._id),
    variant: variantId,
    documentVersions: versions,
  })
  return existing ? params : {...params, [CREATE_VARIANT_PARAM]: variantId}
}
