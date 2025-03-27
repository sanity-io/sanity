import {type ElementTone} from '@sanity/ui/theme'

import {type TargetPerspective} from '../../perspective/types'
import {isReleaseDocument} from '../store/types'
import {RELEASE_TYPES_TONES} from './const'
import {isDraftPerspective, isPublishedPerspective} from './util'

/** @internal */
export function getReleaseTone(release: TargetPerspective): ElementTone {
  if (isPublishedPerspective(release)) return 'positive'
  if (isDraftPerspective(release)) return 'default'

  if (isReleaseDocument(release)) {
    if (release.state === 'archived') {
      return 'default'
    }

    if (release?.metadata?.releaseType === 'asap') {
      return RELEASE_TYPES_TONES.asap.tone
    }

    if (release?.metadata?.releaseType === 'undecided') {
      return RELEASE_TYPES_TONES.undecided.tone
    }

    if (release?.metadata?.releaseType === 'scheduled') {
      return RELEASE_TYPES_TONES.scheduled.tone
    }
  }

  return 'default'
}
