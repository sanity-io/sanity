// @flow
import {Change, Block} from 'slate'

type Options = {
  defaultBlock?: Block
}

// This plugin handles enter on empty list elements, deletes it,
// and either creates a new empty default block or subleveled list block below

export default function ListItemOnEnterKeyPlugin(options: Options = {}) {
  const {defaultBlock} = options
  if (!defaultBlock) {
    throw new Error("Missing required option 'defaultBlock'")
  }
  return {
    // eslint-disable-next-line complexity
    onKeyDown(event: SyntheticKeyboardEvent<*>, change: Change) {
      if (event.key !== 'Enter') {
        return undefined
      }
      const {value} = change
      const {document, startKey, startBlock} = value

      // Only do listItem nodes
      const isList = startBlock.data.get('listItem')
      if (!isList) {
        return undefined
      }

      // Return if current listItem is not empty
      if (startBlock.text !== '') {
        return undefined
      }

      const previousBlock = document.getPreviousBlock(startKey)
      if (previousBlock && !previousBlock.data.get('listItem')) {
        return undefined
      }

      // If on top of document
      // and no text insert a node before
      if (!previousBlock) {
        change.insertBlock(defaultBlock).focus()
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
      return change
    }
  }
}
