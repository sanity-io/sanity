// @flow

import type {SlateEditor} from '../typeDefs'
import {Block} from 'slate'

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
    onKeyDown(event: SyntheticKeyboardEvent<*>, editor: SlateEditor, next: void => void) {
      if (event.key !== 'Enter') {
        return next()
      }
      const {value} = editor
      const {document, startBlock, selection} = value

      // Only do listItem nodes
      const isList = startBlock && startBlock.data && startBlock.data.get('listItem')
      if (!isList) {
        return next()
      }

      // Return if current listItem is not empty
      if (startBlock.text !== '') {
        return next()
      }
      const previousBlock = document.getPreviousBlock(selection.start.key)
      if (previousBlock && !previousBlock.data.get('listItem')) {
        return next()
      }

      // If on top of document
      // and no text insert a node before
      if (!previousBlock) {
        // If block is empty, remove the list prop
        if (startBlock.text === '') {
          const newData = startBlock.data.toObject()
          delete newData.listItem
          editor.setNodeByKey(startBlock.key, {data: newData})
          return editor
        }
        editor.insertBlock(defaultBlock).focus()
        return editor
      }

      // Delete previous listItem if previous list item is empty
      if (previousBlock && previousBlock.data.get('listItem')) {
        editor.deleteBackward(1)
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
      const nextBlock = document.getNextBlock(selection.start.key)
      if (nextBlock && !nextBlock.data.get('listItem') && !nextBlock.isVoid) {
        editor.moveToStartOfNode(nextBlock)
      } else {
        editor.insertBlock(blockToInsert).focus()
      }
      return editor
    }
  }
}
