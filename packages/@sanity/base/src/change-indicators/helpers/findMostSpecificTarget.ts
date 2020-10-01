import * as PathUtils from '@sanity/util/paths'
import {TrackedChange, TrackedArea} from '../'

export function findMostSpecificTarget(
  targetType: 'change' | 'field',
  id: string,
  values: Map<string, TrackedChange | TrackedArea>
): TrackedChange | undefined {
  const path = PathUtils.fromString(id.slice(id.indexOf('-') + 1))
  const exactId = `${targetType}-${PathUtils.toString(path)}`
  if (values.has(exactId)) {
    return values.get(exactId) as TrackedChange
  }

  let mostSpecific: TrackedChange | undefined
  for (const [targetId, target] of values) {
    if (!('path' in target) || !targetId.startsWith(targetType)) {
      continue
    }

    const numEqual = PathUtils.numEqualSegments(path, target.path)
    const mostSpecificPath = mostSpecific ? mostSpecific.path : []
    if (numEqual === 0 || numEqual <= mostSpecificPath.length) {
      continue
    }

    if (numEqual !== target.path.length) {
      // Only match full paths, eg if target is foo.bar.baz,
      // don't match foo.lol even if `foo` is the most specific
      continue
    }

    mostSpecific = target

    if (numEqual === path.length) {
      // On exact match, return early
      break
    }
  }

  return mostSpecific
}
