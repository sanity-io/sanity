import {type ObjectSchemaType} from '@sanity/types'

import {isReleaseDocument} from '../releases/store/types'
import {isDraftPerspective, isPublishedPerspective} from '../releases/util/util'
import {type TargetPerspective} from './types'

/**
 * @internal
 */
export type PerspectiveNotWriteableReason =
  | 'INSUFFICIENT_DATA'
  | 'RELEASE_NOT_ACTIVE'
  | 'PUBLISHED_NOT_WRITEABLE'
  | 'DRAFTS_NOT_WRITEABLE'

/**
 * Check whether the provided schema type can be written to the provided perspective. This depends
 * on factors such as whether the schema type supports live-editing, whether the perspective
 * represents an inactive release, and whether the perspective represents a special group (e.g.
 * published documents).
 *
 * @internal
 */
export function isPerspectiveWriteable({
  selectedPerspective,
  isDraftModelEnabled,
  schemaType,
}: {
  selectedPerspective: TargetPerspective
  isDraftModelEnabled: boolean
  schemaType?: ObjectSchemaType
}): {result: true} | {result: false; reason: PerspectiveNotWriteableReason} {
  if (typeof schemaType === 'undefined') {
    return {
      result: false,
      reason: 'INSUFFICIENT_DATA',
    }
  }

  if (isReleaseDocument(selectedPerspective) && selectedPerspective.state !== 'active') {
    return {
      result: false,
      reason: 'RELEASE_NOT_ACTIVE',
    }
  }

  if (isPublishedPerspective(selectedPerspective) && schemaType.liveEdit !== true) {
    return {
      result: false,
      reason: 'PUBLISHED_NOT_WRITEABLE',
    }
  }

  if (
    isDraftPerspective(selectedPerspective) &&
    !isDraftModelEnabled &&
    schemaType.liveEdit !== true
  ) {
    return {
      result: false,
      reason: 'DRAFTS_NOT_WRITEABLE',
    }
  }

  return {
    result: true,
  }
}
