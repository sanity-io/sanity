import {type ClientPerspective, type ReleaseDocument} from '@sanity/client'

import {type PerspectiveStack, type ReleaseId} from '../../perspective/types'
import {getReleaseIdFromReleaseDocumentId} from '../util/getReleaseIdFromReleaseDocumentId'

/**
 * Sorts releases by their release type and created date.
 * @internal
 */
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
const DRAFTS: ['drafts'] = ['drafts']
const PUBLISHED: ['published'] = ['published']
const EMPTY: [] = []

export function getReleasesPerspectiveStack({
  selectedPerspectiveName,
  releases,
  excludedPerspectives,
  isDraftModelEnabled,
}: {
  selectedPerspectiveName: ReleaseId | undefined | 'published'
  releases: ReleaseDocument[]
  excludedPerspectives: string[]
  isDraftModelEnabled: boolean
}): PerspectiveStack {
  const defaultPerspective = isDraftModelEnabled ? DRAFTS : PUBLISHED
  if (!selectedPerspectiveName) {
    return defaultPerspective
  }
  if (selectedPerspectiveName === 'published') {
    return PUBLISHED
  }

  const sorted: ClientPerspective = sortReleases(releases).map((release) =>
    getReleaseIdFromReleaseDocumentId(release._id),
  )
  const selectedIndex = sorted.indexOf(selectedPerspectiveName)
  if (selectedIndex === -1) {
    // we're in a non-release stack
    return [selectedPerspectiveName, ...defaultPerspective]
  }
  return sorted
    .slice(selectedIndex)
    .concat(defaultPerspective)
    .filter((name) => !excludedPerspectives.includes(name))
}
