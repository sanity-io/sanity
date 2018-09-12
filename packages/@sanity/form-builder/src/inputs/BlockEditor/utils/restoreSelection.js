// @flow

import type {SlateChange, Patch} from '../typeDefs'
import {Operation} from 'slate'
import calculateNewOffset from './calculateNewOffset'

export default function restoreSelection(change: SlateChange, select: Operation, patches: Patch[]) {
  change.applyOperations([select])

  // We might need to move the focus offset if any of the patches involves the selected content
  const focusTextKey = select.value.focusText && select.value.focusText.key
  const patchBlockKeys =
    focusTextKey && patches.map(patch => patch.path[0] && patch.path[0]._key).filter(Boolean)
  const isSameText = patchBlockKeys && patchBlockKeys.some(key => focusTextKey.indexOf(key) > -1)
  if (isSameText) {
    const currentOffset = select.properties.focus.offset
    const calculatedOffset = calculateNewOffset(
      select.value.focusText.text,
      change.value.focusText.text,
      currentOffset
    )
    if (calculatedOffset !== 0) {
      const moveOffset = currentOffset + calculatedOffset
      change.moveTo(moveOffset)
    }
  }
  return change
}
