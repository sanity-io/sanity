import {SLATE_LIST_ITEM_TYPE, SLATE_LIST_BLOCKS, SLATE_DEFAULT_NODE} from '../constants'

function onKeyDown(event, data, state, editor) {
  if (data.key !== 'enter') {
    return null
  }
  const isList = state.blocks.some(block => block.type === SLATE_LIST_ITEM_TYPE)
  if (!isList) {
    return null
  }
  const {document, startKey, startBlock} = state
  const previousBlock = document.getPreviousBlock(startKey)
  const nextBlock = document.getNextBlock(startKey)

  // This plugin should only kick in when the cursor is at the last listItem of a list,
  // and we have other list items above, and the last  and current list item is empty.
  // Return null if any of the variables below evals to true.
  const inMiddleOfList = nextBlock && nextBlock.type === SLATE_LIST_ITEM_TYPE
  const noPreviousblock = !previousBlock
  const previousBlockNotListItem = previousBlock && previousBlock.type !== SLATE_LIST_ITEM_TYPE
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
      .insertBlock(SLATE_DEFAULT_NODE)
  }
  SLATE_LIST_BLOCKS.forEach(type => {
    transform = transform.unwrapBlock(type)
  })
  const nextState = transform.apply()
  event.preventDefault()
  return nextState
}

function ListItemOnEnterKey(...args) {
  return {
    onKeyDown
  }
}

export default ListItemOnEnterKey
