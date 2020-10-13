import * as PathUtils from '@sanity/util/paths'
import {isKeyedObject} from '@sanity/types'
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
    const lastPathSegment = target.path[target.path.length - 1]
    const pathOnlyDiffersByKey =
      numEqual === target.path.length - 1 && isKeyedObject(lastPathSegment)

    if (numEqual === 0) {
      continue
    } else if (numEqual !== target.path.length && !pathOnlyDiffersByKey) {
      /*
       * We only allow matching to shorter paths if the last element in the path is a keyed object.
       * `foo.bar.portableTextField[_key=abc123]` should resolve to `foo.bar.portableTextField`.
       *
       * Otherwise we'll only get a connector line when you add new elements to a portable text
       * field and not when you alter an existing part.
       */
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
