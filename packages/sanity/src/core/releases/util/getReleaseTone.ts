import {type BadgeTone} from '@sanity/ui'

import {type ReleaseDocument} from '../store/types'
import {isDraftPerspective, isPublishedPerspective} from './util'

/** @internal */
export function getReleaseTone(release: ReleaseDocument | 'published' | 'drafts'): BadgeTone {
  /* conflicts with the type scheduled, maybe confusion with published?
 if (release.publishedAt !== undefined) {
    return 'positive'
  }*/
  if (isPublishedPerspective(release)) return 'positive'
  if (isDraftPerspective(release)) return 'default'

  if (release.state === 'archived') {
    return 'default'
  }

  if (release?.metadata?.releaseType === 'asap') {
    return 'critical'
  }

  if (release?.metadata?.releaseType === 'undecided') {
    return 'suggest'
  }

  if (release?.metadata?.releaseType === 'scheduled') {
    return 'primary'
  }
  return 'default'
}
