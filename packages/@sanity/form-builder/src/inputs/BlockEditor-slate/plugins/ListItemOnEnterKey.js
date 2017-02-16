function createOnKeyDown(insertBlockStyle, callbackFn) {
  return function onKeyDown(event, data, state, editor) {

    const {document, startKey, startBlock} = state
    let transform = state.transform()

    // only for key
    if (data.key !== 'enter') {
      return null
    }

    // This plugin should only kick in when the cursor is at the last listItem of a list.
    // and the new current list item is empty.
    // OR if no previous block (top of document)

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

    const blockToInsert = {type: 'contentBlock', data: {style: insertBlockStyle}}

    // If on top of document
    // and no text insert a node before
    if (!previousBlock) {
      return transform
        .insertBlock(blockToInsert)
        .focus()
        .apply()
    }

    const nextBlock = document.getNextBlock(startKey)


    // Delete previous listItem if previous list item is empty
    if (previousBlock.data.get('listItem') && !previousBlock.nodes.length) {
      transform = transform.deleteBackward(1)
    }

    // Jump to next node if next node is not a listItem
    if (nextBlock && !nextBlock.data.get('listItem')) {
      transform = transform
        .collapseToStartOf(nextBlock)
    } else {
      // Insert a given block type
      transform = transform
        .insertBlock(blockToInsert)
        .focus()
    }
    const nextState = transform.apply()
    if (callbackFn) {
      callbackFn(nextState)
    }
    return nextState
  }
}

function ListItemOnEnterKey(insertBlockStyle, callbackFn) {
  return {
    onKeyDown: createOnKeyDown(insertBlockStyle, callbackFn)
  }
}

export default ListItemOnEnterKey
