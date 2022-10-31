import {Transforms, Descendant} from 'slate'
import {PortableTextMemberTypes, PortableTextSlateEditor} from '../../types/editor'
import {debugWithName} from '../../utils/debug'
import {withoutPatching} from '../../utils/withoutPatching'
import {withoutSaving} from './createWithUndoRedo'

const debug = debugWithName('plugin:withPlaceholderBlock')

interface Options {
  types: PortableTextMemberTypes
  keyGenerator: () => string
}
/**
 * Keep a "placeholder" block present when the editor is empty
 *
 */
export function createWithPlaceholderBlock({
  types,
  keyGenerator,
}: Options): (editor: PortableTextSlateEditor) => PortableTextSlateEditor {
  return function withPlaceholderBlock(editor: PortableTextSlateEditor): PortableTextSlateEditor {
    editor.createPlaceholderBlock = (): Descendant => {
      return {
        _type: types.block.name,
        _key: keyGenerator(),
        style: types.styles[0].value,
        markDefs: [],
        children: [
          {
            _type: 'span',
            _key: keyGenerator(),
            text: '',
            marks: [],
          },
        ],
      }
    }
    const {onChange} = editor
    // Make sure there's a placeholder block present if the editor's children become empty
    editor.onChange = () => {
      onChange()
      if (editor.children.length === 0) {
        withoutPatching(editor, () => {
          withoutSaving(editor, () => {
            debug('Inserting placeholder block')
            Transforms.deselect(editor)
            Transforms.insertNodes(editor, editor.createPlaceholderBlock(), {
              at: [0],
            })
            Transforms.select(editor, {
              focus: {path: [0, 0], offset: 0},
              anchor: {path: [0, 0], offset: 0},
            })
            editor.onChange()
          })
        })
      }
    }
    return editor
  }
}
