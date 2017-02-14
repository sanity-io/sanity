// This plugin inserts an empty default node after enter is pressed
// within a text block which is not a default node type (normal)
// Meaning: when enter is pressed within a title start a new empty
// normal block below
function createOnKeyDown(insertBlockStyle) {
  return function onKeyDown(event, data, state, editor) {
    if (data.key !== 'enter') {
      return null
    }
    const isTextBlock = state.blocks.some(block => block.data.get('style'))
    const isDefaultNode = state.blocks.some(block => block.data.get('style') === insertBlockStyle)
    const {startBlock} = state
    if (!isTextBlock || state.selection.isExpanded || !state.selection.hasEndAtEndOf(startBlock)) {
      return null
    }
    if (!isDefaultNode) {
      const transform = state.transform().insertBlock({
        type: 'contentBlock',
        data: {
          style: insertBlockStyle
        }
      })
      const nextState = transform.apply()
      event.preventDefault()
      return nextState
    }
    return null
  }
}

function TextBlockOnEnterKey(...args) {
  return {
    onKeyDown: createOnKeyDown(args[0])
  }
}

export default TextBlockOnEnterKey
