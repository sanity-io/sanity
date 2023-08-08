import type {Patch} from '@sanity/diff-match-patch'

/**
 * Takes a `patches` array as produced by diff-match-patch and adjusts the
 * `start1` and `start2` properties so that they refer to UCS-2 index instead
 * of a UTF-8 index.
 *
 * @param patches - The patches to adjust
 * @param base - The base string to use for counting bytes
 * @returns A new array of patches with adjusted indicies
 * @beta
 */
export function adjustIndiciesToUcs2(patches: Patch[], base: string): Patch[] {
  let byteOffset = 0
  let idx = 0 // index into the input.

  function advanceTo(target: number) {
    for (; byteOffset < target; ) {
      const codePoint = base.codePointAt(idx)
      if (typeof codePoint === 'undefined') {
        // Reached the end of the base string - the indicies won't be correct,
        // but we also cannot advance any further to find a closer index.
        return idx
      }

      byteOffset += utf8len(codePoint)

      // This is encoded as a surrogate pair.
      if (codePoint > 0xffff) {
        idx += 2
      } else {
        idx += 1
      }
    }

    // Theoretically, we should have reached target - however, due to differences in
    // `base` from the string that the patch was originally based upon, occurences
    // _can_ happen where we go beyond the target due to surrogate pairs or similar.
    // In the PTE, this is okayish - best effort matching is good enough.
    return idx
  }

  const adjusted: Patch[] = []
  for (const patch of patches) {
    adjusted.push({
      diffs: patch.diffs.map((diff) => [...diff]),
      start1: advanceTo(patch.start1),
      start2: advanceTo(patch.start2),
      // utf8Start1: patch.start1,
      // utf8Start2: patch.utf8Start2,
      length1: patch.length1,
      length2: patch.length2,
      // utf8Length1: patch.utf8Length1,
      // utf8Length2: patch.utf8Length2,
    })
  }

  return adjusted
}

function utf8len(codePoint: number): 1 | 2 | 3 | 4 {
  // See table at https://en.wikipedia.org/wiki/UTF-8
  if (codePoint <= 0x007f) return 1
  if (codePoint <= 0x07ff) return 2
  if (codePoint <= 0xffff) return 3
  return 4
}
