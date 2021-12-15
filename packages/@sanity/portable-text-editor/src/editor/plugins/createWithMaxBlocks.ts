import {PortableTextSlateEditor} from '../../types/editor'

/**
 * This plugin makes sure that the PTE maxBlocks prop is respected
 *
 */
export function createWithMaxBlocks(rows: number) {
  return function withMaxBlocks(editor: PortableTextSlateEditor): PortableTextSlateEditor {
    const {apply} = editor
    editor.apply = (operation) => {
      if (rows > 0 && editor.children.length >= rows) {
        if (
          (operation.type === 'insert_node' || operation.type === 'split_node') &&
          operation.path.length === 1
        ) {
          return
        }
      }
      apply(operation)
    }
    return editor
  }
}
