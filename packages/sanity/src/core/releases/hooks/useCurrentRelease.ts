import {useReleases} from '../store'
import {getReleaseIdFromReleaseDocumentId} from '../util/releaseId'
import {useStudioPerspectiveState} from './useStudioPerspectiveState'

export function useCurrentRelease() {
  const {current} = useStudioPerspectiveState()
  const releases = useReleases()
  return releases.data.find((release) => getReleaseIdFromReleaseDocumentId(release._id) === current)
}
