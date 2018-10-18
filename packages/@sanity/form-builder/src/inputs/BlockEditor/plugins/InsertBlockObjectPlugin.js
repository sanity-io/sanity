// @flow

import {Block} from 'slate'
import {randomKey} from '@sanity/block-tools'
import type {SlateChange} from '../typeDefs'

export default function InsertBlockObjectPlugin() {
  return {
    onCommand(command: any, change: SlateChange, next: void => void) {
      if (command.type !== 'insertBlockObject') {
        return next()
      }
      const options = command.args[0] || {}
      const {objectType} = options
      const key = options.key || randomKey(12)
      const block = Block.create({
        type: objectType.name,
        isVoid: true,
        key: key,
        data: {
          _key: key,
          value: {_type: objectType.name, _key: key}
        }
      })
      const {focusBlock} = change.value
      // If the focusBlock is not void or empty, replace it with the block to insert
      if (
        focusBlock &&
        !change.editor.query('isVoid', focusBlock) &&
        focusBlock.nodes.size === 1 &&
        focusBlock.text === ''
      ) {
        change.replaceNodeByKey(focusBlock.key, block).moveTo(block.key, 0)
        return change
      }
      change.insertBlock(block).moveToEndOfBlock()
      return change
    }
  }
}
