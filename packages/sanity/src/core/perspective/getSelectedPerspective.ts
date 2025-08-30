import {type ReleaseDocument} from '@sanity/client'

import {getReleaseIdFromReleaseDocumentId} from '../releases/util/getReleaseIdFromReleaseDocumentId'
import {type HydratedPerspective, type ReleaseId} from './types'

export function getSelectedPerspective(
  selectedPerspectiveName: 'published' | ReleaseId | undefined,
  releases: ReleaseDocument[],
): HydratedPerspective {
  if (!selectedPerspectiveName) return 'drafts'
  if (selectedPerspectiveName === 'published') return 'published'
  const selectedRelease = releases.find(
    (release) => getReleaseIdFromReleaseDocumentId(release._id) === selectedPerspectiveName,
  )
  return selectedRelease || 'drafts'
}
