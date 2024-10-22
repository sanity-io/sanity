import {type BadgeTone} from '@sanity/ui'
import {type ReleaseDocument} from 'sanity'

/** @beta */
export function getReleaseTone(release: Partial<ReleaseDocument>): BadgeTone {
  /* conflicts with the type scheduled, maybe confusion with published?
 if (release.publishedAt !== undefined) {
    return 'positive'
  }*/

  if (release.state === 'archived') {
    return 'default'
  }

  if (release?.metadata?.releaseType === 'asap') {
    return 'critical'
  }

  if (release?.metadata?.releaseType === 'undecided') {
    return 'explore'
  }

  if (release?.metadata?.releaseType === 'scheduled') {
    return 'primary'
  }
  return 'default'
}
