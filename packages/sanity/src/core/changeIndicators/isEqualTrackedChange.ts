import {isEqual} from '@sanity/util/paths'

import {type TrackedChange} from './types'

/**
 * Compares change indicator tracker snapshots field by field: the element by reference, the
 * path with path equality, everything else with `===`. Runs after every render of every
 * change bar, so it avoids a generic deep-compare walk.
 *
 * @internal
 */
export function isEqualTrackedChange(a: TrackedChange | null, b: TrackedChange | null): boolean {
  if (a === b) return true
  if (a === null || b === null) return false
  return (
    a.element === b.element &&
    a.isChanged === b.isChanged &&
    a.hasFocus === b.hasFocus &&
    a.hasHover === b.hasHover &&
    a.hasRevertHover === b.hasRevertHover &&
    a.zIndex === b.zIndex &&
    isEqual(a.path, b.path)
  )
}
