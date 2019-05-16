// @flow
import {Inline} from 'slate'
import {randomKey} from '@sanity/block-tools'
import {editorValueToBlocks, blocksToEditorValue} from '@sanity/block-tools'
import type {SlateEditor, Type} from '../typeDefs'
import {VALUE_TO_JSON_OPTS} from '../utils/createOperationToPatches'

export default function InsertInlineObjectPlugin(blockContentType: Type) {
  function normalizeBlock(block) {
    return blocksToEditorValue(
      editorValueToBlocks(
        {
          document: {
            nodes: [block.toJSON(VALUE_TO_JSON_OPTS)]
          }
        },
        blockContentType
      ),
      blockContentType
    ).document.nodes[0]
  }
  return {
    onCommand(command: any, editor: SlateEditor, next: void => void) {
      if (command.type !== 'insertInlineObject') {
        return next()
      }
      const options = command.args[0] || {}
      const {objectType} = options
      const key = options.key || randomKey(12)
      const inlineProps = {
        key,
        type: objectType.name,
        isVoid: true,
        data: {
          _key: key,
          value: {_type: objectType.name, _key: key}
        }
      }
      const inline = Inline.create(inlineProps)
      editor.insertInline(inline)

      // Normalize the keys in the block nodes to match what is sent to gradient
      const inlinePath = editor.value.selection.focus.path
      const block = editor.value.focusBlock
      editor.replaceNodeByKey(block.key, normalizeBlock(block))
      editor.moveTo(inlinePath, 0)
      return editor
    }
  }
}
