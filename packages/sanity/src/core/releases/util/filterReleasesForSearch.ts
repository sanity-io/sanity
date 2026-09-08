import {type ReleaseDocument} from '@sanity/client'

import {
  getReleaseIdFromReleaseDocumentId,
  isReleaseDocumentId,
} from './getReleaseIdFromReleaseDocumentId'

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
