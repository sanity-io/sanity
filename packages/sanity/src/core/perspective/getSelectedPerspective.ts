import {type ReleaseDocument} from '../releases/store/types'
import {getReleaseIdFromReleaseDocumentId} from '../releases/util/getReleaseIdFromReleaseDocumentId'
import {type ReleaseId, type SelectedPerspective} from './types'

export function getSelectedPerspective(
  selectedPerspectiveName: 'published' | ReleaseId | undefined,
  releases: ReleaseDocument[],
): SelectedPerspective {
  if (!selectedPerspectiveName) return 'drafts'
  if (selectedPerspectiveName === 'published') return 'published'
  const selectedRelease = releases.find(
    (release) => getReleaseIdFromReleaseDocumentId(release._id) === selectedPerspectiveName,
  )
  return selectedRelease || 'drafts'
}
