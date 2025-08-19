import {type ReleaseState} from '@sanity/client'

import {type SelectedPerspective} from '../../perspective/types'
import {formatRelativeLocale, getVersionFromId, isVersionId} from '../../util'
import {type EditableStudioReleaseDocument, type StudioReleaseDocument} from '../types'
import {DEFAULT_RELEASE_TYPE, LATEST} from './const'
import {createReleaseId} from './createReleaseId'

/** @internal */
export type NotArchivedRelease = StudioReleaseDocument & {state: Exclude<ReleaseState, 'archived'>}

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
export function getPublishDateFromRelease(release: StudioReleaseDocument): Date | null {
  const dateString = release.publishedAt || release.publishAt || release.metadata.intendedPublishAt

  if (!dateString) return null

  return new Date(dateString)
}

/** @internal */
export function formatRelativeLocalePublishDate(release: StudioReleaseDocument): string {
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
export function isReleaseScheduledOrScheduling(release: StudioReleaseDocument): boolean {
  return (
    release.metadata.releaseType === 'scheduled' &&
    (release.state === 'scheduled' || release.state === 'scheduling')
  )
}

/** @internal */
export const getReleaseDefaults: () => EditableStudioReleaseDocument = () => ({
  _id: createReleaseId(),
  metadata: {
    title: '',
    description: '',
    releaseType: DEFAULT_RELEASE_TYPE,
    cardinality: 'many',
  },
})

/**
 * Check if the release is archived
 *
 * @internal */
export function isNotArchivedRelease(
  release: StudioReleaseDocument,
): release is NotArchivedRelease {
  return release.state !== 'archived'
}

/**
 * Check if the release is a cardinality one release
 *
 * @internal
 */
export function isCardinalityOneRelease(
  release: StudioReleaseDocument,
): release is StudioReleaseDocument & {
  metadata: StudioReleaseDocument['metadata'] & {
    cardinality: 'one'
  }
} {
  return release.metadata.cardinality === 'one'
}
