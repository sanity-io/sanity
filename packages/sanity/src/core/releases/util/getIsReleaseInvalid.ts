import {type EditableStudioReleaseDocument} from '../types'

export function getIsReleaseInvalid(release: EditableStudioReleaseDocument) {
  return release.metadata?.releaseType === 'scheduled' && !release.metadata?.intendedPublishAt
}
