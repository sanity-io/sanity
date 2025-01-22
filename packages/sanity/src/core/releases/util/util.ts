import {formatRelativeLocale, getVersionFromId, isVersionId} from '../../util'
import {type SelectedPerspective} from '../hooks/usePerspective'
import {type ReleaseDocument} from '../store/types'
import {LATEST} from './const'

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

  if (typeof perspective === 'undefined') return false
  // perspective is `release.${releaseId}`

  if (releaseId === 'Published') return false
  return releaseId === perspective
}

export function isDraftOrPublished(versionName: string): boolean {
  return versionName === 'drafts' || versionName === 'published'
}

/** @internal */
export function getPublishDateFromRelease(release: ReleaseDocument): Date | null {
  if (release.metadata.releaseType !== 'scheduled') return null

  const dateString = release.publishAt || release.metadata.intendedPublishAt
  if (!dateString) return new Date()

  return new Date(dateString)
}

/** @internal */
export function formatRelativeLocalePublishDate(release: ReleaseDocument): string {
  const publishDate = getPublishDateFromRelease(release)

  if (!publishDate) return ''
  return formatRelativeLocale(publishDate, new Date())
}

/** @internal */
export function isPublishedPerspective(
  perspective: SelectedPerspective | string,
): perspective is 'published' {
  return perspective === 'published'
}

/** @internal */
export function isDraftPerspective(
  perspective: SelectedPerspective | string,
): perspective is 'drafts' {
  return perspective === LATEST
}

/** @internal */
export function isReleaseScheduledOrScheduling(release: ReleaseDocument): boolean {
  return release.state === 'scheduled' || release.state === 'scheduling'
}
