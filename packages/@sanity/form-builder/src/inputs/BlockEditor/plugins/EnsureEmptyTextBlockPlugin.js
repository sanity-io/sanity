// @flow

import createEmptyBlock from '../utils/createEmptyBlock'
import type {SlateEditor, BlockContentFeatures} from '../typeDefs'

export default function InsertEmptyTextBlockPlugin(blockContentFeatures: BlockContentFeatures) {
  return {
    onCommand(command: any, editor: SlateEditor, next: void => void) {
      if (command.type !== 'ensureEmptyTextBlock') {
        return next()
      }
      if (editor.value.document.nodes.size !== 0) {
        return next()
      }
      const block = createEmptyBlock(blockContentFeatures)
      editor.applyOperation({
        type: 'insert_node',
        path: [0],
        node: block.toJSON({preserveKeys: true, preserveData: true})
      })
      return editor
    }
  }
}
