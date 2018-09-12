// @flow

import DiffMatchPatch from 'diff-match-patch'

const dmp = new DiffMatchPatch()

export default function calculateNewOffset(text: string, textToDiff: string, currentOffset) {
  let offset = 0
  if (!text) {
    return 0
  }
  const diff = dmp.diff_main(text, textToDiff)
  const firstMatch = diff[0]
  // If the changed happened after the current offset, just return 0
  if (firstMatch && firstMatch[0] === 0 && firstMatch[1].length >= currentOffset) {
    return 0
  }
  // Sum the new offset based on the various diffs
  diff.forEach(([action, txt]) => {
    switch (action) {
      case 1:
        offset += txt.length
        break
      case -1:
        offset -= txt.length
        break
      default:
    }
  })
  return offset
}
