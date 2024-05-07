import {Editor, Path} from 'slate'

import {type PortableTextSlateEditor} from '../../types/editor'
import {type SlateTextBlock, type VoidElement} from '../../types/slate'
import {debugWithName} from '../../utils/debug'

const debug = debugWithName('plugin:withPlaceholderBlock')

/**
 * Keep a "placeholder" block present when the editor is empty
 *
 */
export function createWithPlaceholderBlock(): (
  editor: PortableTextSlateEditor,
) => PortableTextSlateEditor {
  return function withPlaceholderBlock(editor: PortableTextSlateEditor): PortableTextSlateEditor {
    const {apply} = editor

    editor.apply = (op) => {
      if (op.type === 'remove_node') {
        const node = op.node as SlateTextBlock | VoidElement
        if (op.path[0] === 0 && Editor.isVoid(editor, node)) {
          // Check next path, if it exists, do nothing
          const nextPath = Path.next(op.path)
          // Is removing the first block which is a void (not a text block), add a new empty text block in it, if there is no other element in the next path
          if (!editor.children[nextPath[0]]) {
            debug('Adding placeholder block')
            Editor.insertNode(editor, editor.pteCreateEmptyBlock())
          }
        }
      }
      apply(op)
    }
    return editor
  }
}
