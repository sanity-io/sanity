// @flow
import {Change} from 'slate'

export default function changeToFocusPath(change: Change, focusPath?: []) {
  const selection = change.value.selection
  const {focusKey} = selection
  // If current focus is on an annotation, don't set it to the block.
  if (focusPath && focusPath.includes('markDefs')) {
    return undefined
  }
  let path = undefined
  if (focusKey) {
    path = []
    const focusBlock = change.value.document.getClosestBlock(focusKey)
    if (focusBlock) {
      path.push({_key: focusBlock.key})
    }
  }
  return path
}
