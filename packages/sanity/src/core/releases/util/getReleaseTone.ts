import {type BadgeTone} from '@sanity/ui'

import {type SelectedPerspective} from '../../perspective/types'
import {isReleaseDocument} from '../store/types'
import {isDraftPerspective, isPublishedPerspective} from './util'

/** @internal */
export function getReleaseTone(release: SelectedPerspective): BadgeTone {
  if (isPublishedPerspective(release)) return 'positive'
  if (isDraftPerspective(release)) return 'default'

  if (isReleaseDocument(release)) {
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
  }

  return 'default'
}
