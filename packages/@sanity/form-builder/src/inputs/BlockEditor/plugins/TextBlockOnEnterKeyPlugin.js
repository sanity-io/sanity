// @flow
import {Change, Block} from 'slate'

type Options = {
  defaultBlock?: Block
}

// This plugin inserts an empty default block after enter is pressed
// within a block which is not a default block type.
// I.e: when enter is pressed after a title, start a new empty normal block below

export default function TextBlockOnEnterKeyPlugin(options: Options = {}) {
  const {defaultBlock} = options
  if (!defaultBlock) {
    throw new Error("Missing required option 'defaultBlock'")
  }
  return {
    onKeyDown(event: SyntheticKeyboardEvent<*>, change: Change) {
      if (event.key !== 'Enter') {
        return undefined
      }
      const {value} = change
      const isTextBlock = value.blocks.some((block: Block) => block.data.get('style'))
      const isDefaultBlock = value.blocks.some(
        (block: Block) => block.data.get('style') === defaultBlock.data.style
      )
      const isListNode = value.blocks.some((block: Block) => block.data.get('listItem'))
      const {startBlock} = value
      if (
        isListNode ||
        !isTextBlock ||
        value.selection.isExpanded ||
        !value.selection.hasEndAtEndOf(startBlock)
      ) {
        return undefined
      }
      if (!isDefaultBlock) {
        event.preventDefault()
        change.insertBlock(defaultBlock)
        return change
      }
      return undefined
    }
  }
}
