import createEmptyBlock from '../utils/createEmptyBlock'
import {SlateEditor, BlockContentFeatures} from '../typeDefs'

export default function EnsurePlaceHolderBlockPlugin(blockContentFeatures: BlockContentFeatures) {
  return {
    onCommand(command: any, editor: SlateEditor, next: (arg0: void) => void) {
      if (command.type !== 'ensurePlaceHolderBlock') {
        return next()
      }
      if (editor.value.document.nodes.size !== 0) {
        return next()
      }
      const block = createEmptyBlock(blockContentFeatures)
      const node = block.toJSON({preserveKeys: true, preserveData: true})
      node.data = {...node.data, placeholder: true}
      editor.applyOperation({
        type: 'insert_node',
        path: [0],
        node: node
      })
      return editor
    }
  }
}
