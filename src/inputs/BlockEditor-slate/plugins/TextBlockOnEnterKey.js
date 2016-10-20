import {SLATE_TEXT_BLOCKS, SLATE_DEFAULT_NODE} from '../constants'

function onKeyDown(event, data, state, editor) {
  if (data.key !== 'enter') {
    return null
  }
  const isTextBlock = state.blocks.some(block => SLATE_TEXT_BLOCKS.includes(block.type))
  const {startBlock} = state
  if (!isTextBlock || state.selection.isExpanded || !state.selection.hasEndAtEndOf(startBlock)) {
    return null
  }
  const transform = state.transform().insertBlock(SLATE_DEFAULT_NODE)
  const nextState = transform.apply()
  event.preventDefault()
  return nextState
}

function TextBlockOnEnterKey(...args) {
  return {
    onKeyDown
  }
}

export default TextBlockOnEnterKey
