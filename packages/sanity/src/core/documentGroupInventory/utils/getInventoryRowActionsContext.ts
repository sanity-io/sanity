import {type ReleaseDocument} from '@sanity/client'

import {
  type DocumentActionsContext,
  type DocumentActionsVersionType,
  type PartialContext,
} from '../../config/types'
import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {getReleaseIdFromReleaseDocumentId} from '../../releases/util/getReleaseIdFromReleaseDocumentId'
import {isCardinalityOneRelease} from '../../util/releaseUtils'

/**
 * Look the row's release up in the full releases map (inventory machine
 * `context.releases` / `computeSets` `meta.releases.releases`) by
 * `document._system.release._ref`. That map includes the row's own release, so
 * cardinality-one releases resolve as `scheduled-draft`. The version-chip
 * `releases` list is `notCurrentReleases` and omits the chip's own release —
 * do not reuse that lookup here.
 *
 * @internal
 */
export function getInventoryRowVersionType(
  document: VersionInfoDocumentStub,
  release: ReleaseDocument | undefined,
): Exclude<DocumentActionsVersionType, 'revision'> {
  if (!document._system.bundleId) {
    return 'published'
  }

  if (document._system.bundleId === 'drafts') {
    return 'draft'
  }

  if (release && isCardinalityOneRelease(release)) {
    return 'scheduled-draft'
  }

  return 'version'
}

/**
 * @internal
 */
export function getInventoryRowActionsContext(options: {
  document: VersionInfoDocumentStub
  release: ReleaseDocument | undefined
  schemaType: string
}): PartialContext<DocumentActionsContext> {
  const {document, release, schemaType} = options
  const versionType = getInventoryRowVersionType(document, release)
  const isReleaseVersion = versionType === 'version' || versionType === 'scheduled-draft'
  const releaseDocumentId = document._system.release?._ref

  return {
    schemaType,
    documentId: document._system.group._ref,
    versionType,
    releaseId: isReleaseVersion
      ? (document._system.bundleId ??
        (releaseDocumentId ? getReleaseIdFromReleaseDocumentId(releaseDocumentId) : undefined))
      : undefined,
  }
}
