import {type EditableReleaseDocument, type ReleaseDocument, type ReleaseState} from '@sanity/client'

import {type TargetPerspective} from '../../perspective/types'
import {formatRelativeLocale, getVersionFromId, isVersionId} from '../../util'
import {isCardinalityOneRelease, isPausedCardinalityOneRelease} from '../../util/releaseUtils'
import {type CardinalityView, type Mode} from '../tool/overview/queryParamUtils'
import {DEFAULT_RELEASE_TYPE, LATEST} from './const'
import {createReleaseId} from './createReleaseId'

/** @internal */
export type NotArchivedRelease = ReleaseDocument & {state: Exclude<ReleaseState, 'archived'>}

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
  const dateString = release.publishedAt || release.publishAt || release.metadata.intendedPublishAt

  if (!dateString) return null

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
  perspective: TargetPerspective | string,
): perspective is 'published' {
  return perspective === 'published'
}

/** @internal */
export function isDraftPerspective(
  perspective: TargetPerspective | string,
): perspective is 'drafts' {
  return perspective === LATEST
}

/** @internal */
export function isReleaseScheduledOrScheduling(release: ReleaseDocument): boolean {
  return (
    release.metadata.releaseType === 'scheduled' &&
    (release.state === 'scheduled' || release.state === 'scheduling')
  )
}

/** @internal */
export const getReleaseDefaults: () => EditableReleaseDocument = () => ({
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
export function isNotArchivedRelease(release: ReleaseDocument): release is NotArchivedRelease {
  return release.state !== 'archived'
}

/**
 * @internal
 */
export function shouldShowReleaseInView(
  cardinalityView: CardinalityView,
): (release: ReleaseDocument) => boolean {
  return (release: ReleaseDocument): boolean => {
    const isCardinalityOne = isCardinalityOneRelease(release)
    // Show cardinality 'one' releases in 'drafts' view, and cardinality 'many'/undefined in 'releases' view
    return cardinalityView === 'drafts' ? isCardinalityOne : !isCardinalityOne
  }
}

/** @internal */
export interface FilterReleasesOptions<T extends ReleaseDocument> {
  releases: T[]
  archivedReleases: T[]
  cardinalityView: CardinalityView
  releaseGroupMode: Mode
  dateFilter?: {
    filterDate: Date
    getTimezoneAdjustedDateTimeRange: (date: Date) => [Date, Date]
  }
}

/** @internal */
export function filterReleasesForOverview<T extends ReleaseDocument>(
  options: FilterReleasesOptions<T>,
): T[] {
  const {releases, archivedReleases, cardinalityView, releaseGroupMode, dateFilter} = options

  const sourceReleases = releaseGroupMode === 'archived' ? archivedReleases : releases

  const applyDateFilter = (items: T[]): T[] => {
    if (!dateFilter) return items

    const [startOfDayForTimeZone, endOfDayForTimeZone] =
      dateFilter.getTimezoneAdjustedDateTimeRange(dateFilter.filterDate)

    return items.filter((release) => {
      const publishAt = release.publishAt || release.metadata.intendedPublishAt
      if (!publishAt || release.metadata.releaseType !== 'scheduled') return false

      const publishDateUTC = new Date(publishAt)
      return publishDateUTC >= startOfDayForTimeZone && publishDateUTC <= endOfDayForTimeZone
    })
  }

  const dateFiltered = applyDateFilter(sourceReleases)

  if (cardinalityView !== 'drafts') return dateFiltered

  if (releaseGroupMode === 'active') {
    return dateFiltered.filter(
      (release) => release.state === 'scheduled' || release.state === 'scheduling',
    )
  }

  if (releaseGroupMode === 'paused') {
    return dateFiltered.filter((release) => isPausedCardinalityOneRelease(release))
  }

  return dateFiltered
}
