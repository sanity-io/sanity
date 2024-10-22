import {type BadgeTone} from '@sanity/ui'
import {type ReleaseDocument} from 'sanity'

/** @beta */
export function getReleaseTone(release: Partial<ReleaseDocument>): BadgeTone {
  /* conflicts with the type scheduled, maybe confusion with published?
 if (release.publishedAt !== undefined) {
    return 'positive'
  }*/

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
    return 'primary'
  }
  return 'default'
}
