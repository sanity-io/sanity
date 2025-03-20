import {type ClientPerspective} from '@sanity/client'

import {type PerspectiveStack, type ReleaseId} from '../../perspective/types'
import {DRAFTS_FOLDER} from '../../util/draftUtils'
import {type ReleaseDocument} from '../store/types'
import {getReleaseIdFromReleaseDocumentId} from '../util/getReleaseIdFromReleaseDocumentId'

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

export function getReleasesPerspectiveStack({
  selectedPerspectiveName,
  releases,
  excludedPerspectives,
}: {
  selectedPerspectiveName: ReleaseId | undefined | 'published'
  releases: ReleaseDocument[]
  excludedPerspectives: string[]
}): PerspectiveStack {
  if (!selectedPerspectiveName) {
    return ['drafts']
  }
  if (selectedPerspectiveName === 'published') {
    return ['published']
  }
  const sorted: ClientPerspective = sortReleases(releases).map((release) =>
    getReleaseIdFromReleaseDocumentId(release._id),
  )
  const selectedIndex = sorted.indexOf(selectedPerspectiveName)
  if (selectedIndex === -1) {
    return []
  }
  return sorted
    .slice(selectedIndex)
    .concat(DRAFTS_FOLDER)
    .filter((name) => !excludedPerspectives.includes(name))
}
