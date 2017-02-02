function createOnKeyDown(insertBlockType, listType, listItemType) {
  return function onKeyDown(event, data, state, editor) {
    if (data.key !== 'enter') {
      return null
    }
    const isList = state.blocks.some(block => block.type === listItemType)
    if (!isList) {
      return null
    }

    const {document, startKey, startBlock} = state
    const previousBlock = document.getPreviousBlock(startKey)
    const nextBlock = document.getNextBlock(startKey)

    // This plugin should only kick in when the cursor is at the last listItem of a list,
    // and we have other list items above, and the last  and current list item is empty.
    // Return null if any of the variables below evals to true.
    const inMiddleOfList = nextBlock && nextBlock.type === listItemType
    const noPreviousblock = !previousBlock
    const previousBlockNotListItem = previousBlock && previousBlock.type !== listItemType
    const currentListItemNotEmpty = startBlock.text !== ''
    if (inMiddleOfList || noPreviousblock || previousBlockNotListItem || currentListItemNotEmpty) {
      return null
    }
    let transform = state.transform().deleteBackward(1)

    if (nextBlock) {
      transform = transform
        .collapseToStartOf(nextBlock)
    } else {
      transform = transform
        .insertBlock(insertBlockType)
    }
    transform = transform.unwrapBlock(listType)
    const nextState = transform.apply()
    event.preventDefault()
    return nextState
  }
}

function ListItemOnEnterKey(...args) {
  return {
    onKeyDown: createOnKeyDown(args[0], args[1], args[2])
  }
}

export default ListItemOnEnterKey
