// This plugin makes sure a void node above a non-void node not is deleted
// accedentialy. User need to double-backspace in order to delete it


function createOnKeyDown(insertBlockStyle) {
  return function onKeyDown(event, data, state, editor) {

    const {document, startKey, startBlock, focusOffset} = state

    // Only for key
    if (data.key !== 'backspace') {
      return null
    }

    const nextBlock = document.getNextBlock(startKey)
    const previousBlock = document.getPreviousBlock(startKey)
    const blockToInsert = {type: 'contentBlock', data: {style: insertBlockStyle}}

    // If a void block is the only thing in the document
    if (!previousBlock && startBlock.isVoid && !nextBlock) {
      return state.transform()
        .insertBlock(blockToInsert)
        .deleteBackward()
        .apply()
    }

    // Apply only if previousBlock is a void node
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
}

function onBackSpace(insertBlockStyle) {
  return {
    onKeyDown: createOnKeyDown(insertBlockStyle)
  }
}

export default onBackSpace
