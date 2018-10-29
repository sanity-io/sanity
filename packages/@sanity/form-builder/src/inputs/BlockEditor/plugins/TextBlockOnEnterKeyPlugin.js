// @flow

import {randomKey} from '@sanity/block-tools'
import type {SlateEditor} from '../typeDefs'
import {Block} from 'slate'

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
    onKeyDown(event: SyntheticKeyboardEvent<*>, editor: SlateEditor, next: void => void) {
      if (event.key !== 'Enter') {
        return next()
      }
      const {value} = editor
      const isTextBlock = value.blocks.some((block: Block) => block.data.get('style'))
      const isListNode = value.blocks.some((block: Block) => block.data.get('listItem'))
      const {startBlock} = value
      if (
        isListNode ||
        !isTextBlock ||
        value.selection.isExpanded ||
        !value.selection.end.isAtEndOfNode(startBlock)
      ) {
        return next()
      }
      const key = randomKey(12)
      event.preventDefault()
      editor.insertBlock({...defaultBlock, key: key, data: {...defaultBlock.data, _key: key}})
      return editor
    }
  }
}
