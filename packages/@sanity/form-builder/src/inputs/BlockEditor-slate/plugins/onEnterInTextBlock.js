// This plugin inserts an empty default block after enter is pressed
// within a block which is not a default block type.
// I.e: when enter is pressed after a title, start a new empty normal block below

function createOnKeyDown(defaultBlock) {
  return function onKeyDown(event, data, change) {
    if (data.key !== 'enter') {
      return null
    }
    const state = change.state
    const isTextBlock = state.blocks.some(block => block.data.get('style'))
    const isDefaultBlock = state.blocks.some(
      block => block.data.get('style') === defaultBlock.data.style
    )
    const isListNode = state.blocks.some(block => block.data.get('listItem'))
    const {startBlock} = state
    if (
      isListNode ||
      !isTextBlock ||
      state.selection.isExpanded ||
      !state.selection.hasEndAtEndOf(startBlock)
    ) {
      return null
    }
    if (!isDefaultBlock) {
      change.insertBlock(defaultBlock)
      event.preventDefault()
      return change
    }
    return null
  }
}

function textBlockOnEnterKey(insertBlockStyle) {
  return {
    onKeyDown: createOnKeyDown(insertBlockStyle)
  }
}

export default textBlockOnEnterKey
