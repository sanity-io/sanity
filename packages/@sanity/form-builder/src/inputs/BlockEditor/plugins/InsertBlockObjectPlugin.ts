import {Block} from 'slate'
import {randomKey} from '@sanity/block-tools'
import {SlateEditor} from '../typeDefs'

export default function InsertBlockObjectPlugin() {
  return {
    onCommand(command: any, editor: SlateEditor, next: (arg0: void) => void) {
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
      const {focusBlock} = editor.value
      // If the focusBlock is not void and empty, replace it with the block to insert
      if (
        focusBlock &&
        !editor.query('isVoid', focusBlock) &&
        focusBlock.nodes.size === 1 &&
        focusBlock.text === ''
      ) {
        editor.replaceNodeByKey(focusBlock.key, block).moveTo(block.key, 0)
        return editor
      }
      // Seems like a bug in Slate, where insertBlock doesn't account for a missing selection
      // when the document is empty
      if (editor.value.document.nodes.size === 0) {
        editor.applyOperation({
          type: 'insert_node',
          path: [0],
          node: block
        })
        return editor
      }
      editor.insertBlock(block).moveToEndOfBlock()
      return editor
    }
  }
}
