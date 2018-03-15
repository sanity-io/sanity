// This plugin handles enter on empty list elements, deletes it,
// and either creates a new empty default block or subleveled list block below

function createOnKeyDown(defaultBlock, callbackFn) {
  return function onKeyDown(event, data, change, editor) {
    const {document, startKey, startBlock} = change.state

    // only for key
    if (data.key !== 'enter') {
      return null
    }

    // Only do listItem nodes
    const isList = startBlock.data.get('listItem')
    if (!isList) {
      return null
    }

    // Return if current listItem is not empty
    if (startBlock.text !== '') {
      return null
    }

    const previousBlock = document.getPreviousBlock(startKey)
    if (previousBlock && !previousBlock.data.get('listItem')) {
      return null
    }

    // If on top of document
    // and no text insert a node before
    if (!previousBlock) {
      change.insertBlock(defaultBlock).focus()
      if (callbackFn) {
        callbackFn(change)
      }
      return change
    }

    // Delete previous listItem if previous list item is empty
    if (previousBlock && previousBlock.data.get('listItem')) {
      change.deleteBackward(1)
    }

    let blockToInsert = defaultBlock

    // If level is > 1, insert a blank list element with the sublevel below
    const level = startBlock.data.get('level') || 1
    if (level > 1) {
      blockToInsert = {
        ...defaultBlock,
        data: startBlock.data.toObject()
      }
      blockToInsert.data.level = level - 1
    }

    // Jump to next node if next node is not a listItem or a void block
    const nextBlock = document.getNextBlock(startKey)
    if (nextBlock && !nextBlock.data.get('listItem') && !nextBlock.isVoid) {
      change.collapseToStartOf(nextBlock)
    } else {
      change.insertBlock(blockToInsert).focus()
    }
    if (callbackFn) {
      callbackFn(change)
    }
    return change
  }
}

function onEnterInListItem(defaultBlock, callbackFn) {
  return {
    onKeyDown: createOnKeyDown(defaultBlock, callbackFn)
  }
}

export default onEnterInListItem
