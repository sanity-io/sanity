import {type ReleaseDocument} from '@sanity/client'

import {type TargetPerspective} from '../../perspective/types'
import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {LATEST, PUBLISHED} from '../../releases/util/const'
import {readVersionType} from '../../util/versionsUtils'

/**
 * The perspective the version belongs to: published, drafts, a release document, or an
 * anonymous/agent bundle id. Used to pick the matching release avatar.
 *
 * @internal
 */
export function getReleasePerspective({
  release,
  version,
}: {
  release?: ReleaseDocument
  version: VersionInfoDocumentStub
}): TargetPerspective {
  switch (readVersionType(version)) {
    case 'draft':
      return LATEST
    case 'release':
      return release ?? version._system.bundleId ?? PUBLISHED
    case 'agent':
      return version._system.bundleId ?? PUBLISHED
    case 'published':
    default:
      return PUBLISHED
  }
}
