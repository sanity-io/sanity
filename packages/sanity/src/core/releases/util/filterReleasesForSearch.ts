import {type ReleaseDocument} from '@sanity/client'

import {
  getReleaseIdFromReleaseDocumentId,
  isReleaseDocumentId,
} from './getReleaseIdFromReleaseDocumentId'
import {getPublishDateFromRelease} from './util'

/**
 * Narrows a release list by a free-text term, matching the title and the release
 * id. Mirrors `filterVariantsForSearch` so the two perspective dropdowns filter
 * the same way.
 *
 * @internal
 */
export function filterReleasesForSearch(
  releases: ReleaseDocument[],
  searchTerm: string,
): ReleaseDocument[] {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase()

  if (!normalizedSearchTerm) {
    return releases
  }

  return releases.filter((release) => {
    const searchableValues = [
      release.metadata.title,
      // Guarded because this throws on an id without the `_.releases.` prefix.
      isReleaseDocumentId(release._id) ? getReleaseIdFromReleaseDocumentId(release._id) : undefined,
    ]

    return searchableValues.some((value) => value?.toLowerCase().includes(normalizedSearchTerm))
  })
}

/**
 * How well a term matches a release, lower being better. `Infinity` means no match.
 *
 * The tiers answer the same question a person answers when scanning: is this the thing I typed,
 * does it begin with it, does it contain it, or did only the id match. An id match ranks last
 * because a person filtering the menu is almost always typing a title.
 */
function getSearchRank(release: ReleaseDocument, normalizedSearchTerm: string): number {
  const title = release.metadata.title?.toLowerCase()

  if (title === normalizedSearchTerm) return 0
  if (title?.startsWith(normalizedSearchTerm)) return 1
  if (title?.includes(normalizedSearchTerm)) return 2

  // Guarded because this throws on an id without the `_.releases.` prefix.
  const releaseId = isReleaseDocumentId(release._id)
    ? getReleaseIdFromReleaseDocumentId(release._id)
    : undefined

  if (releaseId?.toLowerCase().includes(normalizedSearchTerm)) return 3

  return Infinity
}

/**
 * The releases a term matches, best match first.
 *
 * Used in place of the time bands while a filter is active: a filtered list is a set of results,
 * and the most relevant one belongs at the top rather than wherever its publish date puts it.
 * Equal matches keep time order, so the sequence the rest of the menu reads in survives inside
 * each tier.
 *
 * @internal
 */
export function rankReleasesForSearch(
  releases: ReleaseDocument[],
  searchTerm: string,
): ReleaseDocument[] {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase()

  if (!normalizedSearchTerm) return releases

  return releases
    .map((release) => ({release, rank: getSearchRank(release, normalizedSearchTerm)}))
    .filter(({rank}) => rank !== Infinity)
    .sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank

      const aDate = getPublishDateFromRelease(a.release)?.getTime()
      const bDate = getPublishDateFromRelease(b.release)?.getTime()

      // Dateless releases sit behind dated ones, as they do in the bands.
      if (aDate === undefined) return bDate === undefined ? 0 : 1
      if (bDate === undefined) return -1

      return aDate - bDate
    })
    .map(({release}) => release)
}

/**
 * Whether a free-text term matches a label the menu shows for a perspective that is not a release
 * — Published and Drafts.
 *
 * They are filtered on the same term as the releases: typing "pub" should not leave Published
 * sitting above a "no results" message.
 *
 * @internal
 */
export function matchesSearchTerm(label: string, searchTerm: string): boolean {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase()

  if (!normalizedSearchTerm) return true

  return label.toLowerCase().includes(normalizedSearchTerm)
}
