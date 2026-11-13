import {
  getReleaseIdFromReleaseDocumentId,
  getTargetDocument,
  isReleaseDocument,
  isReleaseScheduledOrScheduling,
  isVariantId,
  type VersionInfoDocumentStub,
} from 'sanity'

import {CREATE_VARIANT_PARAM} from '../../panes/document/constants'

/**
 * The document pane params a pick in the versions flyout adds: `createVariant=<variant id>` when
 * the picked variant has no version in the release in view, so Manage versions opens with its
 * Create variant form ready to add it there. `undefined` for every other pick: the Default
 * audience, a perspective that is not a release, a release that is scheduled (nothing can be added
 * to it), or a variant that already has a version in the release.
 *
 * @internal
 */
export function getCreateVariantPaneParams({
  variantId,
  selectedPerspective,
  versions,
}: {
  /** The picked audience, `null` for the Default one. */
  variantId: string | null
  /** The perspective in view, as `usePerspective` returns it. */
  selectedPerspective: unknown
  /** The document group's versions. */
  versions: VersionInfoDocumentStub[]
}): Record<string, string> | undefined {
  if (!isVariantId(variantId)) return undefined
  if (!isReleaseDocument(selectedPerspective)) return undefined
  if (isReleaseScheduledOrScheduling(selectedPerspective)) return undefined

  const existing = getTargetDocument({
    bundle: getReleaseIdFromReleaseDocumentId(selectedPerspective._id),
    variant: variantId,
    documentVersions: versions,
  })
  return existing ? undefined : {[CREATE_VARIANT_PARAM]: variantId}
}
