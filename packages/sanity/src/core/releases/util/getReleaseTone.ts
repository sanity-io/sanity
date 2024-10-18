import {type BadgeTone} from '@sanity/ui'
import {type BundleDocument} from 'sanity'

export function getReleaseTone(release: Partial<BundleDocument>): BadgeTone {
  if (release.publishedAt !== undefined) {
    return 'positive'
  }

  if (release.archived) {
    return 'default'
  }

  if (release.releaseType === 'asap') {
    return 'critical'
  }

  if (release.releaseType === 'undecided') {
    return 'explore'
  }

  if (release.releaseType === 'scheduled') {
    return 'prospect'
  }
  return 'default'
}
