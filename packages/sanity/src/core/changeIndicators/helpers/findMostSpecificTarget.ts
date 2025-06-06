import {isKeyedObject} from '@sanity/types'
import * as PathUtils from '@sanity/util/paths'

import {type TrackedArea, type TrackedChange} from '../tracker'

export function findMostSpecificTarget(
  targetType: 'change' | 'field',
  id: string,
  values: Map<string, TrackedChange | TrackedArea>,
): TrackedChange | undefined {
  const pathString = id.slice(id.indexOf('-') + 1) || '[]'
  const path = PathUtils.fromString(pathString)
  const exactId = `${targetType}-${PathUtils.toString(path)}`
  if (values.has(exactId)) {
    return values.get(exactId) as TrackedChange
  }

  // No exact match found, let's see if we can find a more specific path that matches part of the path
  if (path.length > 0) {
    /* Path is of the type array, example ["text",{"_key": "134981febb30"},"title"] like this.
     * We start by removing the last element of the path and see if we can find a match.
     * If we don't find a match, we remove the next element and try again.
     * If no more path elements are left, continue with the next step.
     */
    for (let i = path.length - 1; i >= 0; i--) {
      const lessSpecificPath = path.slice(0, i)
      const lessSpecificExactId = `${targetType}-${PathUtils.toString(lessSpecificPath)}`
      if (values.has(lessSpecificExactId)) {
        return values.get(lessSpecificExactId) as TrackedChange
      }
    }
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

  // if (!mostSpecific) {
  //   throw new Error(`target not found: "${id}"`)
  // }

  return mostSpecific
}
