import {type BadgeTone} from '@sanity/ui'
import {type BundleDocument} from 'sanity'

export function getReleaseTone(release: BundleDocument): BadgeTone | undefined {
  if (release.publishedAt !== undefined) {
    return 'positive'
  }

  if (release.archived) {
    return undefined
  }

  if (release.releaseType === 'asap') {
    return 'critical'
  }

  if (release.releaseType === 'undecided') {
    return 'explore'
  }
  return 'prospect'
}
