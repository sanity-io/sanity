// @flow

import {randomKey, editorValueToBlocks, blocksToEditorValue} from '@sanity/block-tools'
import type {SlateEditor, Type} from '../typeDefs'
import {VALUE_TO_JSON_OPTS} from '../utils/createOperationToPatches'
import {Block} from 'slate'

export default function InsertInlineObjectPlugin(blockContentType: Type) {
  return {
    onCommand(command: any, editor: SlateEditor, next: void => void) {
      if (command.type !== 'insertInlineObject') {
        return next()
      }
      const options = command.args[0] || {}
      const {objectType} = options
      const key = options.key || randomKey(12)
      const inline = {
        type: objectType.name,
        isVoid: true,
        key: key,
        data: {
          _key: key,
          value: {_type: objectType.name, _key: key, _oldKey: key}
        }
      }
      editor.insertInline(inline)
      const {value} = editor
      const {focusBlock} = value
      const appliedBlocks = editorValueToBlocks(
        {document: {nodes: [focusBlock.toJSON(VALUE_TO_JSON_OPTS)]}},
        blockContentType
      )
      const newBlock = Block.fromJSON(
        blocksToEditorValue(appliedBlocks, blockContentType).document.nodes[0]
      )
      const inlineObject = newBlock.nodes.find(
        node => node.data && node.data.get('value') && node.data.get('value')._oldKey === key
      )
      const newData = inlineObject.data.toObject()
      delete newData.value._oldKey
      editor.replaceNodeByKey(focusBlock.key, newBlock.toJSON(VALUE_TO_JSON_OPTS))
      editor.setNodeByKey(inlineObject.key, {data: newData})
      editor.moveToEndOfNode(inlineObject)
      return editor
    }
  }
}
