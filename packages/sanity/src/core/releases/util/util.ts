import {
  getVersionFromId,
  isDraftId,
  isPublishedId,
  isVersionId,
  resolveBundlePerspective,
} from '../../util'
import {
  type ReleasePerspective,
  type SelectableReleasePerspective,
  type VersionOriginTypes,
} from '../index'
import {type ReleaseDocument} from '../store/types'
import {
  DRAFTS_PERSPECTIVE,
  type DraftsPerspective,
  PUBLISHED_PERSPECTIVE,
  type PublishedPerspective,
} from './perspective'

/**
 * @beta
 * @param documentId - The document id, e.g. `my-document-id` or `drafts.my-document-id` or `summer.my-document-id`
 * @param perspective - The current perspective, e.g. `release.summer` or undefined, it can be obtained from `useRouter().stickyParams.perspective`
 * @returns boolean - `true` if the document is in the current perspective.
 * e.g:
 * - document: `summer.my-document-id`, perspective: `release.summer` : **true**
 * - document: `my-document-id`, perspective: `release.summer` : **false**
 * - document: `summer.my-document-id`perspective: `release.winter` : **false**
 * - document: `summer.my-document-id`, perspective: `undefined` : **false**
 * - document: `my-document-id`, perspective: `undefined` : **true**
 * - document: `drafts.my-document-id`, perspective: `undefined` : **true**
 */
export function getDocumentIsInPerspective(
  documentId: string,
  perspective: string | undefined,
): boolean {
  const releaseId = getVersionFromId(documentId)

  if (!perspective) return !isVersionId(documentId)

  const releasePerspective = resolveBundlePerspective(perspective)

  if (typeof releasePerspective === 'undefined') return false
  // perspective is `release.${releaseId}`

  if (releaseId === 'Published') return false
  return releaseId === releasePerspective
}

/** @internal */
export function versionDocumentExists(
  documentVersions: ReleaseDocument[] = [],
  releaseId: string,
): boolean {
  return documentVersions.some((version) => version._id === releaseId)
}

export function isDraftOrPublished(versionName: string): boolean {
  return versionName === 'drafts' || versionName === 'published'
}

/**
 * @beta
 * @param documentId - The document id, e.g. `my-document-id` or `drafts.my-document-id` or `summer.my-document-id`
 * @returns VersionOriginTypes - the origin from which this version is being created from
 */
export function getCreateVersionOrigin(documentId: string): VersionOriginTypes {
  if (isDraftId(documentId)) return 'draft'
  if (isPublishedId(documentId)) return 'published'
  return 'version'
}

/** @internal */
export function getPublishDateFromRelease(release: ReleaseDocument): Date {
  const dateString = release.publishAt || release.metadata.intendedPublishAt
  if (!dateString) {
    // Eventually we should remove this fallback, and assert the type of release that is passed in.
    console.error('No publish date found on release', release)
    return new Date()
  }

  return new Date(dateString)
}

/** @internal */
export function isPublishedPerspective(
  perspective: SelectableReleasePerspective,
): perspective is PublishedPerspective {
  return perspective === PUBLISHED_PERSPECTIVE
}

/** @internal */
export function isDraftPerspective(
  perspective: ReleasePerspective | string,
): perspective is DraftsPerspective {
  return perspective === DRAFTS_PERSPECTIVE
}

/** @internal */
export function isReleaseScheduledOrScheduling(release: ReleaseDocument): boolean {
  return release.state === 'scheduled' || release.state === 'scheduling'
}
