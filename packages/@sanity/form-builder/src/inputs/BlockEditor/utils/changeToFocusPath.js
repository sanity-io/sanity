// @flow
import {Change} from 'slate'

export default function changeToFocusPath(change: Change) {
  const selection = change.value.selection
  const {focusKey} = selection
  const path = []
  if (focusKey) {
    const focusBlock = change.value.document.getClosestBlock(focusKey)
    if (focusBlock) {
      path.push({_key: focusBlock.key})
    }
  }
  return path
}
