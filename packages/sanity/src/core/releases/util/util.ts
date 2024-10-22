import {type VersionOriginTypes} from '../../store'
import {type ReleaseDocument} from '../../store/release/types'
import {
  getVersionFromId,
  isDraftId,
  isPublishedId,
  isVersionId,
  resolveBundlePerspective,
} from '../../util'

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
  const bundleId = getVersionFromId(documentId)

  if (!perspective) return !isVersionId(documentId)

  const bundlePerspective = resolveBundlePerspective(perspective)

  if (typeof bundlePerspective === 'undefined') return false
  // perspective is `release.${bundleId}`

  if (bundleId === 'Published') return false
  return bundleId === bundlePerspective
}

/** @internal */
export function versionDocumentExists(
  documentVersions: ReleaseDocument[] = [],
  bundleId: string,
): boolean {
  return documentVersions.some((version) => version._id === bundleId)
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
