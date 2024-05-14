import {Editor, Node, Path, Range, Transforms} from 'slate'

import {type PortableTextMemberSchemaTypes, type PortableTextSlateEditor} from '../../types/editor'
import {type SlateTextBlock, type VoidElement} from '../../types/slate'
import {isEqualToEmptyEditor} from '../../utils/values'

/**
 * Changes default behavior of insertBreak to insert a new block instead of splitting current when the cursor is at the
 * start of the block.
 */
export function createWithInsertBreak(
  types: PortableTextMemberSchemaTypes,
): (editor: PortableTextSlateEditor) => PortableTextSlateEditor {
  return function withInsertBreak(editor: PortableTextSlateEditor): PortableTextSlateEditor {
    const {insertBreak} = editor

    editor.insertBreak = () => {
      if (editor.selection) {
        const focusBlockPath = editor.selection.focus.path.slice(0, 1)
        const focusBlock = Node.descendant(editor, focusBlockPath) as SlateTextBlock | VoidElement

        if (editor.isTextBlock(focusBlock)) {
          // Enter from another style than the first (default one)
          const [, end] = Range.edges(editor.selection)
          // If it's at the start of block, we want to preserve the current block key and insert a new one in the current position instead of splitting the node.
          const isEndAtStartOfNode = Editor.isStart(editor, end, end.path)
          const isEmptyTextBlock = focusBlock && isEqualToEmptyEditor([focusBlock], types)
          if (isEndAtStartOfNode && !isEmptyTextBlock) {
            Editor.insertNode(editor, editor.pteCreateEmptyBlock())
            const [nextBlockPath] = Path.next(focusBlockPath)
            Transforms.select(editor, {
              anchor: {path: [nextBlockPath, 0], offset: 0},
              focus: {path: [nextBlockPath, 0], offset: 0},
            })

            editor.onChange()
            return
          }
        }
      }
      insertBreak()
    }
    return editor
  }
}
