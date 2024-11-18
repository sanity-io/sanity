import {type BadgeTone} from '@sanity/ui'

import {type ReleaseDocument} from '../store/types'
import {PUBLISHED_PERSPECTIVE, type SelectableReleasePerspective} from './perspective'
import {isPublishedPerspective} from './util'

/** @internal */
export function getReleaseTone(release: ReleaseDocument): BadgeTone {
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

/** @internal */
export function getPerspectiveTone(
  perspective: SelectableReleasePerspective = PUBLISHED_PERSPECTIVE,
): BadgeTone {
  /* conflicts with the type scheduled, maybe confusion with published?
 if (release.publishedAt !== undefined) {
    return 'positive'
  }*/
  return isPublishedPerspective(perspective) ? 'positive' : 'default'
}
