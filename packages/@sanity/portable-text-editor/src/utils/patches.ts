import {isEqual} from 'lodash'
import type {Patch} from '../types/patch'

/**
 * Try to compact a set of patches
 *
 */
export function compactPatches(patches: Patch[]) {
  // If the last patch is unsetting everything, just do that
  const lastPatch = patches.slice(-1)[0]
  if (lastPatch && lastPatch.type === 'unset' && lastPatch.path.length === 0) {
    return [lastPatch]
  }
  let finalPatches = patches
  // Run through the patches and remove any redundant ones.
  finalPatches = finalPatches.filter((patch, index) => {
    if (!patch) {
      return false
    }
    const nextPatch = finalPatches[index + 1]
    if (
      nextPatch &&
      nextPatch.type === 'set' &&
      patch.type === 'set' &&
      isEqual(patch.path, nextPatch.path)
    ) {
      return false
    }
    return true
  })
  if (finalPatches.length !== patches.length) {
    return finalPatches
  }
  return patches
}
