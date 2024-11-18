import {type ReleaseDocument} from '../store/types'
import {
  PUBLISHED_PERSPECTIVE,
  type PublishedPerspective,
  type SelectableReleasePerspective,
} from '../util/perspective'
import {getReleaseIdFromReleaseDocumentId, type ReleaseId} from '../util/releaseId'

export function sortReleases(releases: ReleaseDocument[] = []): ReleaseDocument[] {
  // The order should always be:
  // [undecided (sortByCreatedAt), scheduled(sortBy publishAt || metadata.intendedPublishAt), asap(sortByCreatedAt)]
  return [...releases].sort((a, b) => {
    // undecided are always first, then by createdAt descending
    if (a.metadata.releaseType === 'undecided' && b.metadata.releaseType !== 'undecided') {
      return -1
    }
    if (a.metadata.releaseType !== 'undecided' && b.metadata.releaseType === 'undecided') {
      return 1
    }
    if (a.metadata.releaseType === 'undecided' && b.metadata.releaseType === 'undecided') {
      // Sort by createdAt
      return new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime()
    }

    // Scheduled are always at the middle, then by publishAt descending
    if (a.metadata.releaseType === 'scheduled' && b.metadata.releaseType === 'scheduled') {
      const aPublishAt = a.publishAt || a.metadata.intendedPublishAt
      if (!aPublishAt) {
        return 1
      }
      const bPublishAt = b.publishAt || b.metadata.intendedPublishAt
      if (!bPublishAt) {
        return -1
      }
      return new Date(bPublishAt).getTime() - new Date(aPublishAt).getTime()
    }

    // ASAP are always last, then by createdAt descending
    if (a.metadata.releaseType === 'asap' && b.metadata.releaseType !== 'asap') {
      return 1
    }
    if (a.metadata.releaseType !== 'asap' && b.metadata.releaseType === 'asap') {
      return -1
    }
    if (a.metadata.releaseType === 'asap' && b.metadata.releaseType === 'asap') {
      // Sort by createdAt
      return new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime()
    }

    return 0
  })
}

export function getReleasesStack({
  releases,
  current,
  excluded,
}: {
  releases: ReleaseDocument[]
  current: SelectableReleasePerspective | undefined
  excluded: SelectableReleasePerspective[]
}): SelectableReleasePerspective[] {
  if (!current) {
    return []
  }

  const sorted: (ReleaseId | PublishedPerspective)[] = sortReleases(releases).map((release) =>
    getReleaseIdFromReleaseDocumentId(release._id),
  )
  const selectedIndex = sorted.indexOf(current)
  if (selectedIndex === -1) {
    return []
  }
  return sorted
    .slice(selectedIndex)
    .concat(PUBLISHED_PERSPECTIVE)
    .filter((name) => !excluded.includes(name))
}
