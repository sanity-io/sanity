import {type RegionWithIntersectionDetails} from '../types'

export function arePresenceRegionDetailsEqual(
  current: RegionWithIntersectionDetails[],
  next: RegionWithIntersectionDetails[],
): boolean {
  if (current === next) {
    return true
  }

  if (current.length !== next.length) {
    return false
  }

  for (let index = 0; index < current.length; index++) {
    const left = current[index]
    const right = next[index]
    if (
      left.position !== right.position ||
      left.region.id !== right.region.id ||
      Math.round(left.distanceTop) !== Math.round(right.distanceTop) ||
      Math.round(left.distanceBottom) !== Math.round(right.distanceBottom)
    ) {
      return false
    }
  }

  return true
}
