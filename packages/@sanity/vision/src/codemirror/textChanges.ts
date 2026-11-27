import {DIFF_DELETE, DIFF_EQUAL, makeDiff} from '@sanity/diff-match-patch'

import {type TextChange} from './whitespaceChanges'

/**
 * The edits that turn `from` into `to`, positions in `from`, character by character, so that a
 * selection mapped through them stays on the text it was on
 */
export function textChanges(from: string, to: string): TextChange[] {
  const changes: TextChange[] = []
  let position = 0
  // The edit being collected: the deletions and insertions between two runs of equal text
  let editFrom = -1
  let editTo = 0
  let insert = ''
  const endEdit = () => {
    if (editFrom !== -1) changes.push({from: editFrom, to: editTo, insert})
    editFrom = -1
    insert = ''
  }
  for (const [type, text] of makeDiff(from, to)) {
    if (type === DIFF_EQUAL) {
      endEdit()
      position += text.length
      continue
    }
    if (editFrom === -1) {
      editFrom = position
      editTo = position
    }
    if (type === DIFF_DELETE) {
      position += text.length
      editTo = position
    } else {
      insert += text
    }
  }
  endEdit()
  return changes
}
