// @flow
import {Change} from 'slate'

export default function changeToFocusPath(change: Change) {
  const selection = change.value.selection
  const {focusKey} = selection
  if (focusKey) {
    const focusBlock = change.value.document.getClosestBlock(focusKey)
    if (focusBlock) {
      return [{_key: focusBlock.key}]
    }
  }
  return []
}
