// This plugin makes sure a void node above a non-void node not is deleted
// accedentialy. User need to double-backspace in order to delete it


function onKeyDown(event, data, state, editor) {

  const {document, startKey, startBlock, focusOffset, isExpanded} = state

  // Only for key
  if (data.key !== 'backspace') {
    return null
  }

  // Apply only if previousBlock is a void node
  const previousBlock = document.getPreviousBlock(startKey)
  if (!previousBlock || !previousBlock.isVoid) {
    return null
  }

  // Only if there is a void node above
  if (!previousBlock.isVoid) {
    return null
  }

  if (focusOffset === 0 && startBlock.text.length) {
    return state.transform()
      .deleteBackward()
      .apply()
  }

  if (focusOffset === 0 && !startBlock.text.length) {
    return state.transform()
      .collapseToEndOfPreviousBlock()
      .apply()
  }
  return null
}


function onBackSpace() {
  return {
    onKeyDown
  }
}

export default onBackSpace
