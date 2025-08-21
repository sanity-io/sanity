import {type EditableReleaseDocument} from '@sanity/client'

export function getIsReleaseInvalid(release: EditableReleaseDocument) {
  return release.metadata?.releaseType === 'scheduled' && !release.metadata?.intendedPublishAt
}
